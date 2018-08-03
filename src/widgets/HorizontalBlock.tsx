import produce from 'immer'
import * as React from 'react';
import * as uuid from 'uuid/v4'
import CompoundBlock from './CompoundBlock';
import { BlockDef, BlockFactory, dropBlock, DropSide, RenderDesignProps, RenderEditorProps, RenderInstanceProps } from './Blocks'

export interface HorizontalBlockDef extends BlockDef {
  items: BlockDef[]
}

export class HorizontalBlock extends CompoundBlock {
  blockDef: HorizontalBlockDef
  blockFactory: BlockFactory

  constructor(blockDef: HorizontalBlockDef, blockFactory: BlockFactory) {
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
      const draft = d as HorizontalBlockDef

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
        // Insert if dropped left or right
        if ((dropSide === DropSide.left) && (draft.items[i].id === targetBlockId)) {
          draft.items.splice(i, 0, droppedBlockDef)
          return
        }
        else if ((dropSide === DropSide.right) && (draft.items[i].id === targetBlockId)) {
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
      <div key={childBlockDef.id} style={{ display: "inline-block", width: (100/this.blockDef.items.length) + "%" }}>
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

// class HorizontalBlockInstance extends React.Component<{ id: string }> {
//   validate() { return [] }

//   render() {
//     return (
//       <select>
//         <option value="a">A {this.props.id}</option>
//       </select>
//     )      
//   }
// }