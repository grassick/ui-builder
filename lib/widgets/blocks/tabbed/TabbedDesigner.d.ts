import React from "react";
import { TabbedBlockDef, TabbedBlockTab } from "./tabbed";
import { BlockDef } from "../../blocks";
import { DesignCtx } from "../../../contexts";
interface Props {
    tabbedBlockDef: TabbedBlockDef;
    designCtx: DesignCtx;
}
interface State {
    activeIndex: number;
}
export default class TabbedDesigner extends React.Component<Props, State> {
    constructor(props: Props);
    /** Handle adding a block to a tab */
    handleAddContent: (tabIndex: number, addedBlockDef: BlockDef) => void;
    handleSelectTab: (index: number) => void;
    renderTab(tab: TabbedBlockTab, index: number): JSX.Element;
    render(): JSX.Element;
}
export {};
