import * as React from 'react';
import LeafBlock from './LeafBlock'
import { BlockDef, BlockInstance, RenderDesignProps, RenderInstanceProps, CreateBlock, NullBlockStore, Filter } from './blocks'
import { LookupWidget } from './widgets';
import Expr from './Expr';

// Block which contains a widget
export interface WidgetBlockDef extends BlockDef {
  widgetId: string;   // Id of the widget
  contextVarMap: { [contextVarId: string]: string };  // Maps each internal widgets' context variable id to an external one
}

export class WidgetBlock extends LeafBlock {
  blockDef: WidgetBlockDef
  createBlock: CreateBlock
  lookupWidget: LookupWidget

  constructor(blockDef: WidgetBlockDef, createBlock: CreateBlock, lookupWidget: LookupWidget) {
    super(blockDef)
    this.createBlock = createBlock
    this.lookupWidget = lookupWidget
  }

  async getInitialFilters(contextVarId: string): Promise<Filter[]> { 
    const widgetDef = this.lookupWidget(this.blockDef.widgetId)
    if (widgetDef && widgetDef.blockDef) {
      const innerBlock = this.createBlock(widgetDef.blockDef)

      // Map contextVarId to internal id
      for (const key of Object.keys(this.blockDef.contextVarMap)) {
        const value = this.blockDef.contextVarMap[key]
        if (value === contextVarId) {
          return innerBlock.getInitialFilters(key)
        }
      }
    }

    return []
  }

  renderDesign(props: RenderDesignProps) {
    // Find the widget
    const widgetDef = this.lookupWidget(this.blockDef.widgetId)
    if (widgetDef && widgetDef.blockDef) {
      const innerBlock = this.createBlock(widgetDef.blockDef)

      // Create props for rendering inner block
      const innerProps : RenderDesignProps = {
        selectedId: null,
        locale: props.locale,
        contextVars: widgetDef.contextVars,
        store: new NullBlockStore(),
        wrapDesignerElem(blockDef: BlockDef, elem: React.ReactElement<any>) { return elem },
        renderPlaceholder(parentBlockId: string, parentBlockSection: string) { return <div/> }
      }
  
      return props.wrapDesignerElem(this.blockDef,
        <div>
          {innerBlock.renderDesign(innerProps)}
          {/* Cover up design so it can't be edited */}
          <div style={{ position: "absolute", left: 0, right: 0, top: 0, bottom: 0 }}/>
        </div>
      )     
    } 
    else { // Handle case of widget with null block
      return props.wrapDesignerElem(this.blockDef, <div style={{height: 10}}/>)
    }
  }

  renderInstance(props: RenderInstanceProps, ref: (blockInstance: BlockInstance | null) => void): React.ReactElement<any> {
    // Find the widget
    const widgetDef = this.lookupWidget(this.blockDef.widgetId)
    if (widgetDef && widgetDef.blockDef) {
      const innerBlock = this.createBlock(widgetDef.blockDef)

      const innerProps : RenderInstanceProps = {
        locale: props.locale,
        database: props.database,
        contextVars: widgetDef.contextVars,
        getContextVarValue: (contextVarId: string) => {
          // Lookup outer id
          const outerContextVarId = this.blockDef.contextVarMap[contextVarId]
          if (outerContextVarId) {
            return props.getContextVarValue(outerContextVarId)
          }
          else {
            return
          }
        }, 
        getContextVarExprValue: (contextVarId: string, expr: Expr) => {
          // Lookup outer id
          const outerContextVarId = this.blockDef.contextVarMap[contextVarId]
          if (outerContextVarId) {
            return props.getContextVarExprValue(outerContextVarId, expr)
          }
          else {
            return
          }
        }, 
        onSelectContextVar: (contextVarId: string, primaryKey: any) => {
          // Lookup outer id
          const outerContextVarId = this.blockDef.contextVarMap[contextVarId]
          if (outerContextVarId) {
            props.onSelectContextVar(outerContextVarId, primaryKey)
          }
        },
        setFilter: (contextVarId: string, filter: Filter) => {
          // Lookup outer id
          const outerContextVarId = this.blockDef.contextVarMap[contextVarId]
          if (outerContextVarId) {
            props.setFilter(outerContextVarId, filter)
          }
        },
      }
  
      return innerBlock.renderInstance(innerProps, ref)
    } 
    else { // Handle case of widget with null block
      return <div/>
    }
  }
}