import { Expr, Schema, ExprUtils, ExprValidator } from "mwater-expressions";
import { ContextVar, createExprVariables } from "./widgets/blocks";
import * as d3Format from 'd3-format';
import { FormatLocaleObject } from "d3-format";
import moment from "moment";

/** Expression which is embedded in the text string */
export interface EmbeddedExpr {
  /** Context variable (row or rowset) to use for expression */
  contextVarId: string | null

  /** Expression to be displayed */
  expr: Expr

  /** d3 format of expression for numbers, moment.js format for date (default ll) and datetime (default lll)  */
  format: string | null
}

/** Format an embedded string which is a string with {0}, {1}, etc. to be replaced by expressions */
export const formatEmbeddedExprString = (options: {
  /** text with {0}, {1}... embedded */
  text: string
  /** Expressions to be substituted in */
  embeddedExprs: EmbeddedExpr[]
  /** Values of expressions */
  exprValues: any[]
  schema: Schema
  contextVars: ContextVar[]
  locale: string
  formatLocale?: FormatLocaleObject
}) => {
  let text = options.text

  const formatLocale = options.formatLocale || d3Format

  // Format and replace
  for (let i = 0 ; i < options.exprValues.length ; i++) {
    let str

    const expr = options.embeddedExprs![i].expr
    const exprType = new ExprUtils(options.schema, createExprVariables(options.contextVars)).getExprType(expr)
    const format = options.embeddedExprs![i].format
    const value = options.exprValues[i]

    if (value == null) {
      str = ""
    }
    else {
      if (exprType === "number" && value != null) {
        str = formatLocale.format(format || "")(value)
      }
      else if (exprType === "date" && value != null) {
        str = moment(value, moment.ISO_8601).format(format || "ll")
      }
      else if (exprType === "datetime" && value != null) {
        str = moment(value, moment.ISO_8601).format(format || "lll")
      }
      else {
        str = new ExprUtils(options.schema, createExprVariables(options.contextVars)).stringifyExprLiteral(expr, value, options.locale)
      }
    }
    
    text = text.replace(`{${i}}`, str)
  }
  return text
}

/** Validate embedded expressions, returning null if ok, message otherwise */
export const validateEmbeddedExprs = (options: {
  /** Expressions to be substituted in */
  embeddedExprs: EmbeddedExpr[]
  schema: Schema
  contextVars: ContextVar[]
}) => {
  for (const embeddedExpr of options.embeddedExprs) {
    // Validate cv
    const contextVar = options.contextVars.find(cv => cv.id === embeddedExpr.contextVarId && (cv.type === "rowset" || cv.type === "row"))
    if (!contextVar) {
      return "Context variable required"
    }

    const exprValidator = new ExprValidator(options.schema, createExprVariables(options.contextVars))
    let error: string | null
    
    // Validate expr
    error = exprValidator.validateExpr(embeddedExpr.expr, { table: contextVar.table })
    if (error) {
      return error
    }
  }

  return null
}