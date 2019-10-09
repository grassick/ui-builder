import produce from 'immer'
import * as React from 'react';
import CompoundBlock from '../CompoundBlock';
import { BlockDef, RenderDesignProps, RenderEditorProps, RenderInstanceProps, ContextVar, ChildBlock, CreateBlock, ValidateBlockOptions } from '../blocks'
import { localize } from '../localization';
import { LocalizedTextPropertyEditor, PropertyEditor, LabeledProperty, ContextVarPropertyEditor } from '../propertyEditors';
import VirtualDatabase from '../../database/VirtualDatabase';
import ContextVarsInjector from '../ContextVarsInjector';
import * as _ from 'lodash'
import { LocalizedString, Expr } from 'mwater-expressions';
import uuid = require('uuid');
import { WidgetLibrary } from '../../designer/widgetLibrary';
import { ActionLibrary } from '../ActionLibrary';

export interface SaveCancelBlockDef extends BlockDef {
  type: "saveCancel"
  saveLabel: LocalizedString | null
  cancelLabel: LocalizedString | null
  child: BlockDef | null

  /** Message to confirm discarding changes */
  confirmDiscardMessage: LocalizedString | null

  /** Context variable containing row to delete to enable a Delete button */
  deleteContextVarId?: string | null

  /** Label of delete button if present */
  deleteLabel?: LocalizedString | null

  /** Optional confirmation message for delete */
  confirmDeleteMessage?: LocalizedString | null
}

/** Block that has a save/cancel button pair at bottom. Changes are only sent to the database if save is clicked.
 * When either is clicked, the page is closed. Has optional delete button too.
 */
export class SaveCancelBlock extends CompoundBlock<SaveCancelBlockDef> {
  getChildren(contextVars: ContextVar[]): ChildBlock[] {
    return this.blockDef.child ? [{ blockDef: this.blockDef.child, contextVars: contextVars}] : []
  }

  validate(options: ValidateBlockOptions) { 
    if (!this.blockDef.saveLabel) {
      return "Save label required"
    }

    if (!this.blockDef.cancelLabel) {
      return "Cancel label required"
    }

    if (!this.blockDef.confirmDiscardMessage) {
      return "Confirm discard message required"
    }

    if (this.blockDef.deleteContextVarId) {
      if (!this.blockDef.deleteLabel) {
        return "Delete label required"
      }
      const deleteCV = options.contextVars.find(cv => cv.id == this.blockDef.deleteContextVarId)
      if (!deleteCV) {
        return "Delete context variable not found"
      }
      if (deleteCV.type !== "row") {
        return "Delete context variable wrong type"
      }
    }

    return null 
  }
 
  processChildren(action: (self: BlockDef | null) => BlockDef | null): BlockDef {
    const child = action(this.blockDef.child)
    return produce(this.blockDef, draft => {
      draft.child = child
    })
  }

  renderDesign(props: RenderDesignProps) {
    const handleAdd = (addedBlockDef: BlockDef) => {
      props.store.alterBlock(this.id, produce((b: SaveCancelBlockDef) => { 
        b.child = addedBlockDef 
        return b
      }), addedBlockDef.id)
    }

    const saveLabelText = localize(this.blockDef.saveLabel, props.locale)
    const cancelLabelText = localize(this.blockDef.cancelLabel, props.locale)
    const deleteLabelText = localize(this.blockDef.deleteLabel, props.locale)

    return (
      <div>
        { props.renderChildBlock(props, this.blockDef.child, handleAdd) }
        <div className="save-cancel-footer">
          { this.blockDef.deleteContextVarId ?
            <button type="button" className="btn btn-danger" style={{float: "left"}}>{deleteLabelText}</button>
          : null}
          <button type="button" className="btn btn-primary">{saveLabelText}</button>
          &nbsp;
          <button type="button" className="btn btn-default">{cancelLabelText}</button>
        </div>
      </div>
    )
  }

  /** Special case as the inner block will have a virtual database and its own expression evaluator */
  getSubtreeContextVarExprs(options: {
    contextVar: ContextVar,
    widgetLibrary: WidgetLibrary, 
    actionLibrary: ActionLibrary, 
    /** All context variables */
    contextVars: ContextVar[], 
    createBlock: CreateBlock }): Expr[] {
    return []
  }

  renderInstance(props: RenderInstanceProps) {
    return <SaveCancelInstance renderInstanceProps={props} blockDef={this.blockDef} createBlock={this.createBlock} />
  }
  
  renderEditor(props: RenderEditorProps) {
    return (
      <div>
        <LabeledProperty label="Save Label">
          <PropertyEditor obj={this.blockDef} onChange={props.onChange} property="saveLabel">
            {(value, onChange) => <LocalizedTextPropertyEditor value={value} onChange={onChange} locale={props.locale} />}
          </PropertyEditor>
        </LabeledProperty>
        <LabeledProperty label="Cancel Label">
          <PropertyEditor obj={this.blockDef} onChange={props.onChange} property="cancelLabel">
            {(value, onChange) => <LocalizedTextPropertyEditor value={value} onChange={onChange} locale={props.locale} />}
          </PropertyEditor>
        </LabeledProperty>
        <LabeledProperty label="Confirm Discard Message">
          <PropertyEditor obj={this.blockDef} onChange={props.onChange} property="confirmDiscardMessage">
            {(value, onChange) => <LocalizedTextPropertyEditor value={value} onChange={onChange} locale={props.locale} />}
          </PropertyEditor>
        </LabeledProperty>
        <LabeledProperty label="Optional Delete Target">
          <PropertyEditor obj={this.blockDef} onChange={props.onChange} property="deleteContextVarId">
            {(value, onChange) => <ContextVarPropertyEditor value={value} onChange={onChange} contextVars={props.contextVars} types={["row"]} />}
          </PropertyEditor>
        </LabeledProperty>
        { this.blockDef.deleteContextVarId ?
          <LabeledProperty label="Delete Label">
            <PropertyEditor obj={this.blockDef} onChange={props.onChange} property="deleteLabel">
              {(value, onChange) => <LocalizedTextPropertyEditor value={value} onChange={onChange} locale={props.locale} />}
            </PropertyEditor>
          </LabeledProperty>
        : null }
        { this.blockDef.deleteContextVarId ?
          <LabeledProperty label="Optional Confirm Delete Message">
            <PropertyEditor obj={this.blockDef} onChange={props.onChange} property="confirmDeleteMessage">
              {(value, onChange) => <LocalizedTextPropertyEditor value={value} onChange={onChange} locale={props.locale} />}
            </PropertyEditor>
          </LabeledProperty>
        : null }
        </div>
    )
  }
}

interface SaveCancelInstanceProps {
  renderInstanceProps: RenderInstanceProps
  blockDef: SaveCancelBlockDef
  createBlock: CreateBlock
}

interface SaveCancelInstanceState {
  virtualDatabase: VirtualDatabase

  /** True when control has been destroyed by save or cancel */
  destroyed: boolean

  /** True when control is saving */
  saving: boolean
}

/** Instance swaps out the database for a virtual database */
class SaveCancelInstance extends React.Component<SaveCancelInstanceProps, SaveCancelInstanceState> {
  /** Stores validation registrations for all sub-components so that they can be validated
   * before being saved. 
   */
  validationRegistrations: { [key: string]: (() => string | null) }

  /** Function to call to unregister validation */
  unregisterValidation: () => void

  constructor(props: SaveCancelInstanceProps) {
    super(props)

    this.validationRegistrations = {}

    this.state = {
      virtualDatabase: new VirtualDatabase(props.renderInstanceProps.database, props.renderInstanceProps.schema, props.renderInstanceProps.locale), 
      destroyed: false,
      saving: false
    }
  }

  componentDidMount() {
    this.unregisterValidation = this.props.renderInstanceProps.registerForValidation(this.validate)
  }

  componentWillUnmount() {
    this.unregisterValidation()
  }

  validate = () => {
    // Confirm if changes present
    if (this.state.virtualDatabase.mutations.length > 0) {
      if (!confirm(localize(this.props.blockDef.confirmDiscardMessage, this.props.renderInstanceProps.locale))) {
        // Return empty string to block without message
        return ""
      }
    }
    return null
  }

  handleSave = async () => {
    // Validate all instances that have registered
    const validationMessages: string[] = []

    for (const key of Object.keys(this.validationRegistrations)) {
      const msg = this.validationRegistrations[key]()
      if (msg != null) {
        validationMessages.push(msg)
      }
    }

    if (validationMessages.length > 0) {
      // "" just blocks
      if (_.compact(validationMessages).length > 0) {
        alert(_.compact(validationMessages).join("\n"))
      }
      return
    }

    this.setState({ saving: true })
    try {
      await this.state.virtualDatabase.commit()
    }
    catch (err) {
      // TODO localize
      alert("Unable to save changes")
      this.setState({ saving: false })
      return
    }
    this.setState({ saving: false, destroyed: true })
    this.props.renderInstanceProps.pageStack.closePage()
  }

  handleCancel = () => {
    this.state.virtualDatabase.rollback()
    this.setState({ destroyed: true })
    this.props.renderInstanceProps.pageStack.closePage()
  }

  handleDelete = async () => {
    // Confirm deletion
    if (this.props.blockDef.confirmDeleteMessage && !confirm(localize(this.props.blockDef.confirmDeleteMessage, this.props.renderInstanceProps.locale))) {
      return     
    }
    // Do actual deletion
    const db = this.props.renderInstanceProps.database
    const deleteCV = this.props.renderInstanceProps.contextVars.find(cv => cv.id == this.props.blockDef.deleteContextVarId)
    if (!deleteCV) {
      throw new Error("Missing delete CV")
    }
    const rowId = this.props.renderInstanceProps.contextVarValues[deleteCV.id]
    if (!rowId) {
      throw new Error("Missing delete row id")
    }

    try {
      const tx = db.transaction()
      await tx.removeRow(deleteCV.table!, rowId)
      await tx.commit()
    } catch (err) {
      // TODO localize
      alert("Unable to delete row")
      return
    }

    this.state.virtualDatabase.rollback()
    this.setState({ destroyed: true })
    this.props.renderInstanceProps.pageStack.closePage()
  }

  /** Stores the registration for validation of a child block and returns an unregister function */
  registerChildForValidation = (validate: () => string | null): (() => void) => {
    const key = uuid()
    this.validationRegistrations[key] = validate
    return () => {
      delete this.validationRegistrations[key]
    }
  }

  render() {
    if (this.state.destroyed) {
      return null
    }

    const saveLabelText = localize(this.props.blockDef.saveLabel, this.props.renderInstanceProps.locale)
    const cancelLabelText = localize(this.props.blockDef.cancelLabel, this.props.renderInstanceProps.locale)
    const deleteLabelText = localize(this.props.blockDef.deleteLabel, this.props.renderInstanceProps.locale)

    // Replace renderChildBlock with function that keeps all instances for validation
    const renderInstanceProps = { 
      ...this.props.renderInstanceProps, 
      registerForValidation: this.registerChildForValidation 
    }

    // Inject new database and re-inject all context variables. This is needed to allow computed expressions
    // to come from the virtual database
    return (
      <div>
        <ContextVarsInjector 
          createBlock={this.props.createBlock} 
          database={this.state.virtualDatabase}
          injectedContextVars={renderInstanceProps.contextVars}
          injectedContextVarValues={renderInstanceProps.contextVarValues}
          innerBlock={this.props.blockDef.child}
          renderInstanceProps={renderInstanceProps}
          schema={renderInstanceProps.schema}>
          { (innerRenderInstanceProps: RenderInstanceProps, loading: boolean, refreshing: boolean) => {
            if (loading) {
              return <div style={{ color: "#AAA", fontSize: 18, textAlign: "center" }}><i className="fa fa-circle-o-notch fa-spin"/></div>
            }
            return (
              <div style={{ opacity: refreshing ? 0.6 : undefined }}>
                { innerRenderInstanceProps.renderChildBlock(innerRenderInstanceProps, this.props.blockDef.child) }
              </div>
            )
          }}
          </ContextVarsInjector>

        <div className="save-cancel-footer">
          { this.props.blockDef.deleteContextVarId && this.props.renderInstanceProps.contextVarValues[this.props.blockDef.deleteContextVarId] ?
            <button type="button" className="btn btn-danger" onClick={this.handleDelete} style={{float: "left"}}>{deleteLabelText}</button>
          : null}
          <button type="button" className="btn btn-primary" onClick={this.handleSave} disabled={this.state.saving}>{saveLabelText}</button>
          &nbsp;
          <button type="button" className="btn btn-default" onClick={this.handleCancel} disabled={this.state.saving}>{cancelLabelText}</button>
        </div>
      </div>
    )
  }
}