import produce from 'immer'
import * as React from 'react';
import * as uuid from 'uuid/v4'
import CompoundBlock from './CompoundBlock';
import { BlockDef, BlockFactory, dropBlock, DropSide, RenderDesignProps, RenderEditorProps, RenderInstanceProps } from './blocks'

export interface VerticalBlockDef extends BlockDef {
  items: BlockDef[]
}

export class VerticalBlock extends CompoundBlock {
  blockDef: VerticalBlockDef
  blockFactory: BlockFactory

  constructor(blockDef: VerticalBlockDef, blockFactory: BlockFactory) {
    super(blockDef, blockFactory)
  }

  get id() { return this.blockDef.id }

  getChildBlockDefs(): BlockDef[] {
    return this.blockDef.items
  }
 
  getContextVarExprs(contextVarId: string) { return [] }

  clone(): BlockDef {
    return produce(this.blockDef, draft => {
      draft.id = uuid()

      for (let i = 0; i< draft.items.length; i++) {
        draft.items[i] = this.blockFactory(draft.items[i]).clone()
      }
    })
  }

  replaceBlock(blockId: string, replacementBlockDef: BlockDef | null): BlockDef | null {
    if (blockId === this.id) {
      return replacementBlockDef
    }

    return produce(this.blockDef as BlockDef, d => {
      const draft = d as VerticalBlockDef

      for (let i = draft.items.length - 1; i >= 0 ; i--) {
        const childBlock = this.blockFactory(draft.items[i]).replaceBlock(blockId, replacementBlockDef)
        if (childBlock) {
          draft.items[i] = childBlock
        }
        else if (draft.items.length > 1) {
          draft.items.splice(i, 1)
        }
        else {
          return draft.items[(i === 0) ? 1 : 0]
        }
      }
      return
    })
  }

  addBlock(addedBlockDef: BlockDef, parentBlockId: string | null, parentBlockSection: any): BlockDef {
    throw new Error("Not applicable");
  }

  dropBlock(droppedBlockDef: BlockDef, targetBlockId: string, dropSide: DropSide): BlockDef {
    // If self
    if (targetBlockId === this.id) {
      return dropBlock(droppedBlockDef, this.blockDef, dropSide)
    }

    return produce(this.blockDef, draft => {
      for (let i = 0; i < draft.items.length; i++) {
        // Insert if dropped top or bottom
        if ((dropSide === DropSide.top) && (draft.items[i].id === targetBlockId)) {
          draft.items.splice(i, 0, droppedBlockDef)
          return
        }
        else if ((dropSide === DropSide.bottom) && (draft.items[i].id === targetBlockId)) {
          draft.items.splice(i + 1, 0, droppedBlockDef)
          return
        }
        else {
          draft.items[i] = this.blockFactory(draft.items[i]).dropBlock(droppedBlockDef, targetBlockId, dropSide)
        }
      }
    })
  }

  renderChildDesigner(props: RenderDesignProps, childBlockDef: BlockDef) {
    const childBlock = this.blockFactory(childBlockDef)

    return (
      <div key={childBlockDef.id}>
        { childBlock.renderDesign(props) }
      </div>
    )
  }

  renderDesign(props: RenderDesignProps) {
    return (
      <div>
        { this.blockDef.items.map(childBlock => this.renderChildDesigner(props, childBlock)) }
      </div>
    )      
  }

  renderInstance(props: RenderInstanceProps) {
    return <div/>
  }
  
  renderEditor(props: RenderEditorProps) {
    return null
  }
}
