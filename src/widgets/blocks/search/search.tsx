import * as React from 'react';
import LeafBlock from '../../LeafBlock'
import { BlockDef, RenderDesignProps, RenderInstanceProps, ValidateBlockOptions, RenderEditorProps } from '../../blocks'
import { Expr, ExprValidator } from 'mwater-expressions';
import { LabeledProperty, ContextVarPropertyEditor, PropertyEditor, LocalizedTextPropertyEditor } from '../../propertyEditors';
import SearchBlockInstance from './SearchBlockInstance';
import ListEditor from '../../ListEditor';
import { ExprComponent } from 'mwater-expressions-ui';
import { LocalizedString, localize } from '../../localization';

export interface SearchBlockDef extends BlockDef {
  type: "search"

  /** Placeholder in box */
  placeholder: LocalizedString | null

  /** Id of context variable of rowset for table to use */
  rowsetContextVarId: string | null

  /** Text expressions to search on  */
  searchExprs: Array<Expr | null>
}

export class SearchBlock extends LeafBlock<SearchBlockDef> {
  validate(options: ValidateBlockOptions) { 
    // Validate rowset
    const rowsetCV = options.contextVars.find(cv => cv.id === this.blockDef.rowsetContextVarId && cv.type === "rowset")
    if (!rowsetCV) {
      return "Rowset required"
    }
    
    if (this.blockDef.searchExprs.length === 0) {
      return "Search expression required"
    }

    const exprValidator = new ExprValidator(options.schema)
    
    for (const searchExpr of this.blockDef.searchExprs) {
      if (!searchExpr) {
        return "Search expression required"
      }

      let error: string | null
      
      // Validate expr
      error = exprValidator.validateExpr(searchExpr, { table: rowsetCV.table, types: ["text"] })
      if (error) {
        return error
      }
    }

    return null
  }
  
  renderDesign(props: RenderDesignProps) {
    return (
      <div className="input-group" style={{ padding: 5 }}>
        <span className="input-group-addon"><i className="fa fa-search"/></span>
        <input 
          type="text" 
          className="form-control input-sm" 
          style={{maxWidth: "20em"}} 
          placeholder={localize(this.blockDef.placeholder, props.locale)} 
        />
      </div>
    )
  }

  renderInstance(props: RenderInstanceProps): React.ReactElement<any> {
    return <SearchBlockInstance blockDef={this.blockDef} renderInstanceProps={props} />
  }

  renderEditor(props: RenderEditorProps) {
    // Get rowset context variable
    const rowsetCV = props.contextVars.find(cv => cv.id === this.blockDef.rowsetContextVarId)

    return (
      <div>
        <LabeledProperty label="Rowset">
          <PropertyEditor obj={this.blockDef} onChange={props.onChange} property="rowsetContextVarId">
            {(value, onChange) => <ContextVarPropertyEditor value={value} onChange={onChange} contextVars={props.contextVars} types={["rowset"]} />}
          </PropertyEditor>
        </LabeledProperty>

        { rowsetCV ? 
          <LabeledProperty label="Search expressions">
          <PropertyEditor obj={this.blockDef} onChange={props.onChange} property="searchExprs">
            {(value, onItemsChange) => {

              const handleAddSearchExpr = () => {
                onItemsChange(value.concat(null))
              }
              return (
                <div>
                  <ListEditor items={value} onItemsChange={onItemsChange}>
                    { (expr: Expr, onExprChange) => (
                      <ExprComponent value={expr} schema={props.schema} dataSource={props.dataSource} onChange={onExprChange} table={rowsetCV.table!} types={["text"]} />
                    )}
                  </ListEditor>
                  <button type="button" className="btn btn-link btn-sm" onClick={handleAddSearchExpr}>
                    + Add Expression
                  </button>
                </div>
              )
            }}
          </PropertyEditor>
        </LabeledProperty>
        : null}

        <LabeledProperty label="Placeholder">
          <PropertyEditor obj={this.blockDef} onChange={props.onChange} property="placeholder">
            {(value, onChange) => <LocalizedTextPropertyEditor value={value} onChange={onChange} locale={props.locale} />}
          </PropertyEditor>
        </LabeledProperty>
      </div>
    )
  }
}