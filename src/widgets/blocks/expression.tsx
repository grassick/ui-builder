import * as React from 'react';
import LeafBlock from '../LeafBlock'
import { BlockDef, BlockInstance, RenderDesignProps, RenderInstanceProps, RenderEditorProps } from '../blocks'
import { TextPropertyEditor, PropertyEditor, ContextVarPropertyEditor, LabeledProperty } from '../propertyEditors';
import { Expr, ExprUtils, Schema } from 'mwater-expressions';
import { ExprComponent } from 'mwater-expressions-ui';

export interface ExpressionBlockDef extends BlockDef {
  type: "expression"
  
  /** Context variable (row or rowset) to use for expression */
  contextVarId: string

  /** Expression to be displayed */
  expr: Expr
}

export class ExpressionBlock extends LeafBlock<ExpressionBlockDef> {

  getContextVarExprs(contextVarId: string): Expr[] { 
    return (contextVarId === this.blockDef.contextVarId) ? [this.blockDef.expr] : [] 
  }
  
  renderDesign(props: RenderDesignProps) {
    const summary = new ExprUtils(props.schema).summarizeExpr(this.blockDef.expr, props.locale)

    return (
      <div>
        <span className="text-muted">[</span>
        {summary}
        <span className="text-muted">]</span>
      </div>
    )     
  }


  renderInstance(props: RenderInstanceProps): React.ReactElement<any> {
    // TODO validate
    if (!this.blockDef.contextVarId || !this.blockDef.expr) {
      return <div/>
    }

    const value = props.getContextVarExprValue(this.blockDef.contextVarId, this.blockDef.expr)
    const str = new ExprUtils(props.schema).stringifyExprLiteral(this.blockDef.expr, value, props.locale)

    return (
      <div>{str}</div>
    )     
  }

  // validate(schema: Schema): string | null {
  //   if (!this.blockDef.)
  //   return null
  // }

  renderEditor(props: RenderEditorProps) {
    const contextVar = props.contextVars.find(cv => cv.id === this.blockDef.contextVarId)

    return (
      <div>
        <LabeledProperty label="Context Variable">
          <PropertyEditor obj={this.blockDef} onChange={props.onChange} property="contextVarId">
            {(value, onChange) => <ContextVarPropertyEditor value={value} onChange={onChange} contextVars={props.contextVars} types={["row", "rowset"]} />}
          </PropertyEditor>
        </LabeledProperty>

        { contextVar && contextVar.table 
          ?
          <LabeledProperty label="Expression">
            <PropertyEditor obj={this.blockDef} onChange={props.onChange} property="expr">
              {(value: Expr, onChange) => (
                <ExprComponent 
                  value={value} 
                  onChange={onChange} 
                  schema={props.schema} 
                  dataSource={props.dataSource} 
                  aggrStatuses={["individual", "aggregate", "literal"]}
                  table={contextVar.table!}/>
              )}
            </PropertyEditor>
          </LabeledProperty>
          : null
        }
      </div>
    )
  }
}