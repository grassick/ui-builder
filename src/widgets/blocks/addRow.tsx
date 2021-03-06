import produce from 'immer'
import * as React from 'react';
import { BlockDef, ContextVar, ChildBlock, createExprVariables, CreateBlock, Block } from '../blocks'
import * as _ from 'lodash';
import { ExprValidator, Schema, LiteralExpr, Expr } from 'mwater-expressions';
import ContextVarsInjector from '../ContextVarsInjector';
import { TextInput } from 'react-library/lib/bootstrap';
import { PropertyEditor, LabeledProperty, TableSelect } from '../propertyEditors';
import { ColumnValuesEditor, ContextVarExpr } from '../columnValues';
import { DesignCtx, InstanceCtx } from '../../contexts';

/** Block which creates a new row and adds it as a context variable to its content */
export interface AddRowBlockDef extends BlockDef {
  type: "addRow"

  /** Table that the row will be added to */
  table?: string
  
  /** Name of the row context variable */
  name?: string | null

  /** Expressions to generate column values */
  columnValues: { [columnId: string]: ContextVarExpr }

  /** Block which is in the passed the row */
  content: BlockDef | null
}

export class AddRowBlock extends Block<AddRowBlockDef> {
  getChildren(contextVars: ContextVar[]): ChildBlock[] {
    if (this.blockDef.content) {
      const contextVar = this.createContextVar()
      return [{ blockDef: this.blockDef.content, contextVars: contextVar ? contextVars.concat([contextVar]) : contextVars }]
    }
    return []
  }

  createContextVar(): ContextVar | null {
    if (this.blockDef.table) {
      return { type: "row", id: this.blockDef.id, name: this.blockDef.name || "Added row", table: this.blockDef.table }
    }
    return null
  }

  validate(options: DesignCtx) { 
    let error: string | null

    // Check that table is present
    if (!this.blockDef.table || !options.schema.getTable(this.blockDef.table)) {
      return "Table required"
    }

    // Check each column value
    for (const columnId of Object.keys(this.blockDef.columnValues)) {
      error = this.validateColumnValue(options, columnId)
      if (error) {
        return error
      }
    }
    return null
  }

  validateColumnValue(options: DesignCtx, columnId: string): string | null {
    // Check that column exists
    const column = options.schema.getColumn(this.blockDef.table!, columnId)
    if (!column) {
      return "Column not found"
    }

    const exprValidator = new ExprValidator(options.schema, createExprVariables(options.contextVars))

    // Get type of column
    const columnType = (column.type === "join") ? "id" : column.type

    // Check context var
    const contextVarExpr: ContextVarExpr = this.blockDef.columnValues[columnId]
    let contextVar: ContextVar | undefined

    if (contextVarExpr.contextVarId) {
      contextVar = options.contextVars.find(cv => cv.id === contextVarExpr.contextVarId)
      if (!contextVar || !contextVar.table) {
        return "Context variable not found"
      }
    }
    else {
      contextVar = undefined
      // Must be literal
      if (contextVarExpr.expr && contextVarExpr.expr.type !== "literal") {
        return "Literal value required"
      }
    }

    // Validate expr
    let error
    error = exprValidator.validateExpr(contextVarExpr.expr, { table: contextVar ? contextVar.table : undefined, types: [columnType] })
    if (error) {
      return error
    }
  
    return null
  }

  processChildren(action: (self: BlockDef | null) => BlockDef | null): BlockDef {
    const content = action(this.blockDef.content)
    return produce(this.blockDef, draft => {
      draft.content = content
    })
  }

  /** Get context variable expressions needed to add */
  getContextVarExprs(contextVar: ContextVar): Expr[] {
    // Get ones for the specified context var
    return Object.values(this.blockDef.columnValues).filter(cve => cve.contextVarId === contextVar.id).map(cve => cve.expr)
  }
  
  renderDesign(props: DesignCtx) {
    const handleSetContent = (blockDef: BlockDef) => {
      props.store.alterBlock(this.id, produce((b: AddRowBlockDef) => { 
        b.content = blockDef 
        return b
      }), blockDef.id)
    }

    // Create props for child
    const contextVar = this.createContextVar()
    let contentProps = props
    
    // Add context variable if knowable
    if (contextVar) {
      contentProps = { ...contentProps, contextVars: props.contextVars.concat([contextVar]) }
    }

    const contentNode = props.renderChildBlock(contentProps, this.blockDef.content, handleSetContent)

    return (
      <div style={{ paddingTop: 5, paddingBottom: 5, border: "dashed 1px #CCC" }}>
        {contentNode}
      </div>
    )
  }

  renderInstance(props: InstanceCtx) { 
    const contextVar = this.createContextVar()!
    return <AddRowInstance
      blockDef={this.blockDef}
      contextVar={contextVar}
      instanceCtx={props}/>
  }

  renderEditor(props: DesignCtx) {
    return (
      <div>
        <h3>Add Row</h3>
        <LabeledProperty label="Table">
          <PropertyEditor obj={this.blockDef} onChange={props.store.replaceBlock} property="table">
            {(value, onChange) => 
              <TableSelect schema={props.schema} locale={props.locale} value={value} onChange={onChange}/>
            }
          </PropertyEditor>
        </LabeledProperty>
        <LabeledProperty label="Variable Name">
          <PropertyEditor obj={this.blockDef} onChange={props.store.replaceBlock} property="name">
            {(value, onChange) => <TextInput value={value || null} onChange={onChange} placeholder="Unnamed" />}
          </PropertyEditor>
        </LabeledProperty>
        { this.blockDef.table ? 
        <LabeledProperty label="Column Values">
          <PropertyEditor obj={this.blockDef} onChange={props.store.replaceBlock} property="columnValues">
            {(value, onChange) => 
              <ColumnValuesEditor 
                value={value} 
                onChange={onChange}
                schema={props.schema} 
                dataSource={props.dataSource}
                table={this.blockDef.table!}
                contextVars={props.contextVars}
                locale={props.locale}
                />}
          </PropertyEditor>
        </LabeledProperty>
        : null }
      </div>
    )
  }
}

interface Props {
  contextVar: ContextVar
  blockDef: AddRowBlockDef
  instanceCtx: InstanceCtx
}

interface State {
  addedRowId: any
}

/** Instance which adds a row and then injects as context variable */
class AddRowInstance extends React.Component<Props, State> {
  constructor(props: Props) {
    super(props)

    this.state = { 
      addedRowId: null
    }
  }

  componentDidMount() {
    this.performAdd()
  }

  async performAdd() {
    // Create row to insert
    const row = {}

    for (const columnId of Object.keys(this.props.blockDef.columnValues)) {
      const contextVarExpr: ContextVarExpr = this.props.blockDef.columnValues[columnId]

      if (contextVarExpr.contextVarId != null) {
        row[columnId] = this.props.instanceCtx.getContextVarExprValue(contextVarExpr.contextVarId!, contextVarExpr.expr) 
      }
      else {
        row[columnId] = contextVarExpr.expr ? (contextVarExpr.expr as LiteralExpr).value : null
      }
    }

    try {
      const txn = this.props.instanceCtx.database.transaction()
      const addedRowId = await txn.addRow(this.props.blockDef.table!, row)
      await txn.commit()
      this.setState({ addedRowId })
    } catch (err) {
      // TODO localize
      alert("Unable to add row: " + err.message)
      return
    }
  }

  render() {
    // Render wait while adding
    if (!this.state.addedRowId) {
      return <div style={{ color: "#AAA", fontSize: 18, textAlign: "center" }}><i className="fa fa-circle-o-notch fa-spin"/></div>
    }

    // Inject context variable
    return <ContextVarsInjector 
      injectedContextVars={[this.props.contextVar]} 
      injectedContextVarValues={{ [this.props.contextVar.id]: this.state.addedRowId }}
      innerBlock={this.props.blockDef.content}
      instanceCtx={this.props.instanceCtx}>
        {(instanceCtx: InstanceCtx, loading: boolean, refreshing: boolean) => {
          if (loading) {
            return <div style={{ color: "#AAA", fontSize: 18, textAlign: "center" }}><i className="fa fa-circle-o-notch fa-spin"/></div>
          }
          return (
            <div style={{ opacity: refreshing ? 0.6 : undefined }}>
              { this.props.instanceCtx.renderChildBlock(instanceCtx, this.props.blockDef.content) }
            </div>
          )
        }}
      </ContextVarsInjector>
  }
}