import { QueryTableBlockDef, QueryTableBlock } from "./queryTable";
import { ContextVar } from "../../blocks";
import simpleSchema from "../../../__fixtures__/schema";
import { Expr } from "mwater-expressions";
import BlockFactory from "../../BlockFactory";
import { InstanceCtx } from "../../../contexts";
import { ActionLibrary } from "../../ActionLibrary";

// Outer context vars
const rowsetCV: ContextVar = { id: "cv1", type: "rowset", name: "", table: "t1" }
const contextVars: ContextVar[] = [rowsetCV]

const qtbdSingle: QueryTableBlockDef = {
  id: "123",
  type: "queryTable",
  mode: "singleRow",
  headers: [],
  contents: [],
  rowsetContextVarId: "cv1",
  orderBy: null,
  limit: 10,
  where: null,
  rowClickAction: null
}

const createBlock = new BlockFactory().createBlock

const qtbSingle = new QueryTableBlock(qtbdSingle)

const qtbdMultiple: QueryTableBlockDef = {
  id: "123",
  type: "queryTable",
  mode: "multiRow",
  headers: [],
  contents: [],
  rowsetContextVarId: "cv1",
  orderBy: null,
  limit: 10,
  where: null,
  rowClickAction: null
}

const qtbMultiple = new QueryTableBlock(qtbdMultiple)

const schema = simpleSchema()

test("gets single row cv", () => {
  expect(qtbSingle.createRowContextVar(rowsetCV)).toEqual({
    id: "123_row",
    name: "Table row",
    type: "row",
    table: "t1"
  })
})

test("gets multiple row cv", () => {
  expect(qtbMultiple.createRowContextVar(rowsetCV)).toEqual({
    id: "123_rowset",
    name: "Table row rowset",
    type: "rowset",
    table: "t1"
  })
})

test("gets single row cv value", () => {
  expect(qtbSingle.getRowContextVarValue({ id: "123" }, [], schema, rowsetCV, contextVars)).toEqual("123")
})

test("gets multiple row cv value", () => {
  // One non-aggregate, one aggregate
  const exprs: Expr[] = [
    { type: "field", table: "t1", column: "text" },
    { type: "op", table: "t1", op: "count", exprs: [] }
  ]
  expect(qtbMultiple.getRowContextVarValue({ e0: "xyz", e1: 4 }, exprs, schema, rowsetCV, contextVars)).toEqual({
    type: "op",
    op: "and",
    table: "t1",
    exprs: [
      { type: "op", table: "t1", op: "=", exprs: [exprs[0], { type: "literal", valueType: "text", value: "xyz" }] }
    ]
  })
})

test("gets row expressions", () => {
  // Create single expression in contents
  const expr = { type: "field", table: "t1", column: "text" }
  const qtbd = { ...qtbdSingle, contents: [{ type: "expression", id: "re1", contextVarId: "123_row", expr: expr }] }
  const qtb = new QueryTableBlock(qtbd)
  expect(qtb.getRowExprs(contextVars, { createBlock: createBlock } as InstanceCtx)).toEqual([expr])
})

test("gets action expressions", () => {
  // Create simple action
  const expr = { type: "field", table: "t1", column: "text" }
  const qtbd = { ...qtbdSingle, rowClickAction: { type: "addRow", table: "t1", columnValues: { text: { contextVarId: "123_row", expr: expr }}}}
  const qtb = new QueryTableBlock(qtbd)
  expect(qtb.getRowExprs(contextVars, {
    createBlock: createBlock,
    actionLibrary: new ActionLibrary()
  } as InstanceCtx)).toEqual([expr])
})
