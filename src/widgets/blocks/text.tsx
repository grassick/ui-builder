import * as React from 'react';
import LeafBlock from '../LeafBlock'
import { BlockDef, ContextVar } from '../blocks'
import { LabeledProperty, LocalizedTextPropertyEditor, PropertyEditor, EmbeddedExprsEditor } from '../propertyEditors'
import { localize } from '../localization'
import { Select, Checkbox, Toggle } from 'react-library/lib/bootstrap';
import { Expr, LocalizedString } from 'mwater-expressions';
import * as _ from 'lodash';
import { EmbeddedExpr, formatEmbeddedExprString, validateEmbeddedExprs } from '../../embeddedExprs';
import { DesignCtx, InstanceCtx } from '../../contexts';

export interface TextBlockDef extends BlockDef {
  type: "text"
  
  /** Text content */
  text: LocalizedString | null

  style: "p" | "div" | "h1" | "h2" | "h3" | "h4" | "h5"

  bold?: boolean
  italic?: boolean
  underline?: boolean

  /** Expression embedded in the text string. Referenced by {0}, {1}, etc. */
  embeddedExprs?: EmbeddedExpr[] 

  /** How to align text. Default is left */
  align?: "left" | "center" | "right" | "justify"

  /** Color of text. Default is no coloring */
  color?: null | "muted" | "primary" | "success" | "info" | "warning" | "danger" 

  /** True to make multiple lines break */
  multiline?: boolean
}

export class TextBlock extends LeafBlock<TextBlockDef> {
  getContextVarExprs(contextVar: ContextVar): Expr[] { 
    if (this.blockDef.embeddedExprs) {
      return _.compact(_.map(this.blockDef.embeddedExprs, ee => ee.contextVarId === contextVar.id ? ee.expr : null))
    }
    return []
  }

  validate(options: DesignCtx) {
    // Validate expressions
    return validateEmbeddedExprs({
      embeddedExprs: this.blockDef.embeddedExprs || [],
      schema: options.schema,
      contextVars: options.contextVars})
  }

  getClassName() {
    if (this.blockDef.color) {
      return "text-" + this.blockDef.color
    }
    return ""
  }

  renderText(content: React.ReactNode) {
    const style: React.CSSProperties = {}
    if (this.blockDef.bold) {
      style.fontWeight = "bold"
    }
    if (this.blockDef.italic) {
      style.fontStyle = "italic"
    }
    if (this.blockDef.underline) {
      style.textDecoration = "underline"
    }
    if (this.blockDef.align) {
      style.textAlign = this.blockDef.align
    }
    if (this.blockDef.multiline) {
      style.whiteSpace = "pre-line"
    }

    return React.createElement(this.blockDef.style, { style: style, className: this.getClassName() }, content)
  }
  
  renderDesign(props: DesignCtx) {
    const text = localize(this.blockDef.text, props.locale)
    return this.renderText(text ? text : <span className="text-muted">Text</span>)
  }

  renderInstance(instanceCtx: InstanceCtx): React.ReactElement<any> {
    let text = localize(this.blockDef.text, instanceCtx.locale)

    // Get any embedded expression values
    const exprValues = _.map(this.blockDef.embeddedExprs || [], ee => instanceCtx.getContextVarExprValue(ee.contextVarId!, ee.expr))

    // Format and replace
    text = formatEmbeddedExprString({
      text: text, 
      embeddedExprs: this.blockDef.embeddedExprs || [],
      exprValues: exprValues,
      schema: instanceCtx.schema,
      contextVars: instanceCtx.contextVars,
      locale: instanceCtx.locale,
      formatLocale: instanceCtx.formatLocale
    })
    
    return this.renderText(text)
  }

  renderEditor(props: DesignCtx) {
    return (
      <div>
        <LabeledProperty label="Text">
          <PropertyEditor obj={this.blockDef} onChange={props.store.replaceBlock} property="text">
            {(value, onChange) => 
              <LocalizedTextPropertyEditor 
                value={value} 
                onChange={onChange} 
                locale={props.locale} 
                multiline={this.blockDef.multiline} 
                allowCR={this.blockDef.multiline} />
            }
          </PropertyEditor>
        </LabeledProperty>
        <LabeledProperty label="Style">
          <PropertyEditor obj={this.blockDef} onChange={props.store.replaceBlock} property="style">
            {(value, onChange) => 
              <Select 
                value={value} 
                onChange={onChange}
                options={[
                  { value: "div", label: "Plain Text"},
                  { value: "p", label: "Paragraph"},
                  { value: "h1", label: "Heading 1"},
                  { value: "h2", label: "Heading 2"},
                  { value: "h3", label: "Heading 3"},
                  { value: "h4", label: "Heading 4"},
                  { value: "h5", label: "Heading 5"}
            ]} /> }
          </PropertyEditor>
        </LabeledProperty>

        <PropertyEditor obj={this.blockDef} onChange={props.store.replaceBlock} property="bold">
          {(value, onChange) => <Checkbox value={value} onChange={onChange}>Bold</Checkbox>}
        </PropertyEditor>

        <PropertyEditor obj={this.blockDef} onChange={props.store.replaceBlock} property="italic">
          {(value, onChange) => <Checkbox value={value} onChange={onChange}>Italic</Checkbox>}
        </PropertyEditor>

        <PropertyEditor obj={this.blockDef} onChange={props.store.replaceBlock} property="underline">
          {(value, onChange) => <Checkbox value={value} onChange={onChange}>Underline</Checkbox>}
        </PropertyEditor>

        <LabeledProperty label="Alignment">
          <PropertyEditor obj={this.blockDef} onChange={props.store.replaceBlock} property="align">
            {(value, onChange) => 
              <Toggle 
                value={value || "left"} 
                onChange={onChange} 
                options={[
                  { value: "left", label: <i className="fa fa-align-left"/> },
                  { value: "center", label: <i className="fa fa-align-center"/> },
                  { value: "right", label: <i className="fa fa-align-right"/> },
                  { value: "justify", label: <i className="fa fa-align-justify"/> }
                ]} />
            }
          </PropertyEditor>
        </LabeledProperty>

        <PropertyEditor obj={this.blockDef} onChange={props.store.replaceBlock} property="multiline">
          {(value, onChange) => <Checkbox value={value} onChange={onChange}>Multi-line</Checkbox>}
        </PropertyEditor>

        <LabeledProperty label="Color">
          <PropertyEditor obj={this.blockDef} onChange={props.store.replaceBlock} property="color">
            {(value, onChange) => 
              <Select 
                value={value || null} 
                onChange={onChange} 
                options={[
                  { value: null, label: "Default" },
                  { value: "muted", label: "Muted" },
                  { value: "primary", label: "Primary" },
                  { value: "info", label: "Info" },
                  { value: "success", label: "Success" },
                  { value: "warning", label: "Warning" },
                  { value: "danger", label: "Danger" }
                ]} />
            }
          </PropertyEditor>
        </LabeledProperty>

        <LabeledProperty label="Embedded expressions" help="Reference in text as {0}, {1}, etc.">
          <PropertyEditor obj={this.blockDef} onChange={props.store.replaceBlock} property="embeddedExprs">
            {(value: EmbeddedExpr[] | null | undefined, onChange) => (
              <EmbeddedExprsEditor 
                value={value} 
                onChange={onChange} 
                schema={props.schema} 
                dataSource={props.dataSource}
                contextVars={props.contextVars} />
            )}
          </PropertyEditor>
        </LabeledProperty>
      </div>
    )
  }
}

