import * as React from 'react';
import LeafBlock from '../LeafBlock'
import { BlockDef, RenderDesignProps, RenderInstanceProps, RenderEditorProps, ValidateBlockOptions, ContextVar } from '../blocks'
import { LabeledProperty, PropertyEditor, ActionDefEditor } from '../propertyEditors';
import { TextInput, Select } from 'react-library/lib/bootstrap';
import { ActionDef } from '../actions';
import { WidgetLibrary } from '../../designer/widgetLibrary';
import { ActionLibrary } from '../ActionLibrary';
import { Expr } from 'mwater-expressions';
import { localize } from '../localization';

export interface ImageBlockDef extends BlockDef {
  type: "image"

  /** URL of image */
  url?: string

  /** Action to perform when image is clicked */
  clickActionDef: ActionDef | null

  /** Size mode:
   * normal: displays image with maximum width of 100%
   * fullwidth: stretches to 100%
   * banner: stretches to 100% and includes reverse page margin to fill completely
   */
  sizeMode?: "normal" | "fullwidth" | "banner"
}

/** Simple static image block */
export class ImageBlock extends LeafBlock<ImageBlockDef> {
  validate(options: ValidateBlockOptions) { 
    if (!this.blockDef.url) {
      return "URL required"
    }

    let error: string | null

    // Validate action
    if (this.blockDef.clickActionDef) {
      const action = options.actionLibrary.createAction(this.blockDef.clickActionDef)

      error = action.validate({
        schema: options.schema,
        contextVars: options.contextVars,
        widgetLibrary: options.widgetLibrary
      })
      if (error) {
        return error
      }
    }
    return null 
  }

  getContextVarExprs(contextVar: ContextVar, widgetLibrary: WidgetLibrary, actionLibrary: ActionLibrary): Expr[] { 
    // Include action expressions
    if (this.blockDef.clickActionDef) {
      const action = actionLibrary.createAction(this.blockDef.clickActionDef)
      return action.getContextVarExprs(contextVar)
    }

    return [] 
  }
   
  renderImage(handleClick?: () => void) {
    if (!this.blockDef.url) {
      return <i className="fa fa-picture-o"/>
    }
    
    const divStyle: React.CSSProperties = {}
    const imageStyle: React.CSSProperties = {}

    const sizeMode = this.blockDef.sizeMode || "normal"
    if (sizeMode == "normal") {
      imageStyle.maxWidth = "100%"
    }
    else if (sizeMode == "fullwidth") {
      imageStyle.width = "100%"
    }
    else if (sizeMode == "banner") {
      imageStyle.width = "100%"
      divStyle.margin = "-15px -20px 0px -20px"
    }

    return (
      <div onClick={handleClick} style={divStyle}>
        <img src={this.blockDef.url} style={imageStyle}/>
      </div>
    )
  }

  renderDesign(props: RenderDesignProps) {
    return this.renderImage()
  }

  renderInstance(props: RenderInstanceProps): React.ReactElement<any> {
    const handleClick = () => {
      // Confirm if confirm message
      if (this.blockDef.confirmMessage) {
        if (!confirm(localize(this.blockDef.confirmMessage, props.locale))) {
          return
        }
      }

      // Run action
      if (this.blockDef.clickActionDef) {
        const action = props.actionLibrary.createAction(this.blockDef.clickActionDef)

        action.performAction({
          contextVars: props.contextVars,
          database: props.database,
          schema: props.schema,
          locale: props.locale,
          contextVarValues: props.contextVarValues,
          pageStack: props.pageStack, 
          getContextVarExprValue: props.getContextVarExprValue
        })
      }
    }

    return this.renderImage(handleClick)
  }

  renderEditor(props: RenderEditorProps) {
    return (
      <div>
        <LabeledProperty label="URL">
          <PropertyEditor obj={this.blockDef} onChange={props.onChange} property="url">
            {(value, onChange) => <TextInput value={value} onChange={onChange} />}
          </PropertyEditor>
        </LabeledProperty>

        <LabeledProperty label="Size Mode">
          <PropertyEditor obj={this.blockDef} onChange={props.onChange} property="sizeMode">
            {(value, onChange) => 
              <Select value={value || "normal"} onChange={onChange}
              options={[
                { value: "normal", label: "Normal"},
                { value: "fullwidth", label: "Full width"},
                { value: "banner", label: "Banner"}
              ]}/> }
          </PropertyEditor>
        </LabeledProperty>

        <LabeledProperty label="When image clicked">
          <PropertyEditor obj={this.blockDef} onChange={props.onChange} property="clickActionDef">
            {(value, onChange) => (
              <ActionDefEditor 
                value={value} 
                onChange={onChange} 
                locale={props.locale}
                schema={props.schema}
                dataSource={props.dataSource}
                actionLibrary={props.actionLibrary} 
                widgetLibrary={props.widgetLibrary}
                contextVars={props.contextVars} />
            )}
          </PropertyEditor>
        </LabeledProperty>

    </div>
    )
  }
}
