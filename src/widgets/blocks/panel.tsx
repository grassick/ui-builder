import * as React from 'react';
import * as _ from 'lodash';
import { BlockDef, ContextVar, ChildBlock } from '../blocks'
import CompoundBlock from '../CompoundBlock';
import produce from 'immer';
import { DesignCtx, InstanceCtx } from '../../contexts';

/** Panels with optional header and footer */
export interface PanelBlockDef extends BlockDef {
  type: "panel"

  /** Main content of block */
  mainContent: BlockDef | null

  /** Top content of block. null is empty, undefined is not displayed in design mode */
  headerContent?: BlockDef | null

  /** Bottom content of block. null is empty, undefined is not displayed in design mode */
  footerContent?: BlockDef | null
}

export class PanelBlock extends CompoundBlock<PanelBlockDef> {
  getChildren(contextVars: ContextVar[]): ChildBlock[] {
    // Get for all cells
    return _.compact([this.blockDef.mainContent, this.blockDef.headerContent, this.blockDef.footerContent]).map(bd => ({ blockDef: bd!, contextVars: contextVars }))
  }

  validate() { return null }

  processChildren(action: (self: BlockDef | null) => BlockDef | null): BlockDef {
    return produce(this.blockDef, (draft: PanelBlockDef) => {
      draft.mainContent = action(this.blockDef.mainContent)
      if (this.blockDef.headerContent) {
        draft.headerContent = action(this.blockDef.headerContent)
      } 
      if (this.blockDef.footerContent) {
        draft.footerContent = action(this.blockDef.footerContent)
      } 
    })
  }

  renderDesign(props: DesignCtx) {
    const handleSetMainContent = (blockDef: BlockDef) => {
      props.store.alterBlock(this.id, produce((b: PanelBlockDef) => { 
        b.mainContent = blockDef 
      }), blockDef.id)
    }
    const handleSetHeaderContent = (blockDef: BlockDef) => {
      props.store.alterBlock(this.id, produce((b: PanelBlockDef) => { 
        b.headerContent = blockDef 
      }), blockDef.id)
    }
    const handleSetFooterContent = (blockDef: BlockDef) => {
      props.store.alterBlock(this.id, produce((b: PanelBlockDef) => { 
        b.footerContent = blockDef 
      }), blockDef.id)
    }

    const mainContentNode = props.renderChildBlock(props, this.blockDef.mainContent, handleSetMainContent)
    const headerContentNode = this.blockDef.headerContent !== undefined ? props.renderChildBlock(props, this.blockDef.headerContent, handleSetHeaderContent) : null
    const footerContentNode = this.blockDef.footerContent !== undefined ? props.renderChildBlock(props, this.blockDef.footerContent, handleSetFooterContent) : null

    return <PanelComponent 
      header={headerContentNode} 
      main={mainContentNode}
      footer={footerContentNode} />
  }

  renderInstance(props: InstanceCtx): React.ReactElement<any> {
    const mainContentNode = props.renderChildBlock(props, this.blockDef.mainContent)
    const headerContentNode = props.renderChildBlock(props, this.blockDef.headerContent || null)
    const footerContentNode = props.renderChildBlock(props, this.blockDef.footerContent || null)

    return <PanelComponent 
      header={headerContentNode} 
      main={mainContentNode}
      footer={footerContentNode} />
  }

  renderEditor(props: DesignCtx) {
    const showHeader = () => { props.store.replaceBlock({ ...this.blockDef, headerContent: null }) }
    const hideHeader = () => { props.store.replaceBlock({ ...this.blockDef, headerContent: undefined }) }
    const showFooter = () => { props.store.replaceBlock({ ...this.blockDef, footerContent: null }) }
    const hideFooter = () => { props.store.replaceBlock({ ...this.blockDef, footerContent: undefined }) }

    return (
      <div>
        <div>
          { this.blockDef.headerContent === undefined 
            ? <button className="btn btn-link" onClick={showHeader}>Show Header</button>
            : <button className="btn btn-link" onClick={hideHeader}>Hide Header</button>
          }
        </div>
        <div>
          { this.blockDef.footerContent === undefined 
            ? <button className="btn btn-link" onClick={showFooter}>Show Footer</button>
            : <button className="btn btn-link" onClick={hideFooter}>Hide Footer</button>
          }
        </div>
      </div>
    )
  }
  
}

const PanelComponent = (props: { 
  main: React.ReactNode 
  header: React.ReactNode
  footer: React.ReactNode
 }) => {
  return (<div className="panel panel-default">
    { props.header ?
      <div className="panel-heading">
        <div className="panel-title">{props.header}</div>
      </div>
    : null }
    <div className="panel-body">
      {props.main}
    </div>
    { props.footer ?
      <div className="panel-footer">
        {props.footer}
      </div>
    : null }
  </div>
  )
}