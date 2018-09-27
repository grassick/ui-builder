import * as blocks from './blocks'
import BlockFactory from './BlockFactory';
import { ContextVar } from './blocks';

test("drops left", () => {
  const source = { id: "a", type: "dummy" }
  const target = { id: "b", type: "dummy" }
  const result = blocks.dropBlock(source, target, blocks.DropSide.left)
  expect(result.type).toBe("horizontal")
  expect(result.items[0]).toBe(source)
  expect(result.items[1]).toBe(target)
})


test("findBlockAncestry", () => {
  const createBlock = new BlockFactory().createBlock.bind(null, jest.fn())

  // Create simple tree
  const blockDef = {
    id: "a1",
    type: "horizontal",
    align: "justify",
    items: [
      { 
        id: "b1", 
        type: "horizontal",
        align: "justify",
        items: [{ id: "c1", type: "horizontal", items: [] }]
      }
    ]
  }
  
  expect(blocks.findBlockAncestry(blockDef, createBlock, [], "a1")!.map(b => b.blockDef!.id)).toEqual(["a1"])
  expect(blocks.findBlockAncestry(blockDef, createBlock, [], "b1")!.map(b => b.blockDef!.id)).toEqual(["a1", "b1"])
  expect(blocks.findBlockAncestry(blockDef, createBlock, [], "c1")!.map(b => b.blockDef!.id)).toEqual(["a1", "b1", "c1"])
  expect(blocks.findBlockAncestry(blockDef, createBlock, [], "x")).toBeNull()
})

test("findBlockAncestry with queryTable", () => {
  const createBlock = new BlockFactory().createBlock.bind(null, jest.fn())

  // Root cv
  const rootContextVars: ContextVar[] = [
    { id: "cv1", type: "rowset", table: "t1", name: "CV1" }
  ]

  // Create simple tree
  const blockDef = {
    id: "qt1",
    type: "queryTable",
    rowsetContextVarId: "cv1",
    mode: "singleRow",
    headers: [],
    contents: [
      { id: "c1", type: "horizontal", items: [] }
    ]
  }
  
  const ancestry = blocks.findBlockAncestry(blockDef, createBlock, rootContextVars, "c1")
  expect(ancestry).toEqual([
    { blockDef: blockDef, contextVars: rootContextVars },
    { blockDef: blockDef.contents[0], contextVars: rootContextVars.concat({ id: "qt1_row", name: "Table row", type: "row", table: "t1" }) },
  ])
})

test("getBlockTree", () => {
  const createBlock = new BlockFactory().createBlock.bind(null, jest.fn())

  // Create simple tree
  const blockDef = {
    id: "a1",
    type: "horizontal",
    items: [
      { 
        id: "b1", 
        type: "horizontal",
        align: "justify",
        items: [{ id: "c1", type: "horizontal", align: "justify", items: [] }]
      }
    ]
  }
  
  expect(blocks.getBlockTree(blockDef, createBlock, []).map(b => b.blockDef.id)).toEqual(["a1", "b1", "c1"])
})
