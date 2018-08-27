import * as React from 'react';
import { WidgetDef, LookupWidget } from './widgets/widgets';
import WidgetDesigner from './designer/WidgetDesigner';
import HTML5Backend from 'react-dnd-html5-backend'
import { DragDropContext } from 'react-dnd'
import BlockFactory from './widgets/BlockFactory';
import { Schema } from 'mwater-expressions';
import WidgetLibraryDesigner, { WidgetLibrary } from './designer/widgetLibrary';

const basicBlockFactory = new BlockFactory()

const partnerWidgetDef: WidgetDef = {
  "id": "1234",
  "name": "Partner",
  "description": "Test",
  "blockDef": {
    "id": "71e7e315-fb7a-4309-a13e-9c1e72d94dd4",
    "items": [
      {
        "id": "fc2269a6-c74c-4005-b06d-2f9cddd0815e",
        "type": "text",
        "text": {
          "_base": "en",
          "en": "Partner Page"
        },
        "style": "h1"
      },
    ],
    "type": "vertical"
  },
  "contextVars": []
}

const interventionWidgetDef: WidgetDef = {
  "id": "1235",
  "name": "Intervention",
  "description": "Test",
  "blockDef": {
    "id": "71e7e315-fb7a-4309-a13e-9c1e72d94dd4",
    "items": [
      {
        "id": "fc2269a6-c74c-4005-b06d-2f9cddd0815e",
        "type": "text",
        "text": {
          "_base": "en",
          "en": "Intervention Page"
        },
        "style": "h1"
      },
    ],
    "type": "vertical"
  },
  "contextVars": []
}

const initialWidgetLibrary : WidgetLibrary = {
  widgets: {
    "1234": partnerWidgetDef,
    "1235": interventionWidgetDef
  }
}

const schema = new Schema()

@DragDropContext(HTML5Backend)
export default class Demo extends React.Component<{}, { widgetLibrary: WidgetLibrary}> {
  constructor(props: object) {
    super(props)

    this.state = {
      widgetLibrary: initialWidgetLibrary
    }
  }

  handleWidgetLibraryChange = (widgetLibrary: WidgetLibrary) => {
    this.setState({ widgetLibrary })
  }
  
  render() {
    return (
      <div style={{ padding: 5, height: "100%" }}>
        <WidgetLibraryDesigner
          widgetLibrary={this.state.widgetLibrary} 
          blockFactory={basicBlockFactory} 
          schema={schema}
          onWidgetLibraryChange={this.handleWidgetLibraryChange} />
      </div>
    )
  }
}
