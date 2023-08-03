import * as React from "react";

import { createEditorViewState, EmojiPlugin } from 'roosterjs-react';
import { Ribbon, RibbonPlugin } from 'roosterjs-react-ribbon';
import ReactEditor  from "./ReactEditor.tsx";
import { ribbonButtonRenderer } from './ribbonButtonRenderer.tsx';

interface ISampleEditorProps {
  text?: string;
  limit?: number;
}

const ribbonPlugin = new RibbonPlugin();
const emojiPlugin = new EmojiPlugin();
const emojiButton = {
  name: 'btnEmoji',
  onClick: (editor) => emojiPlugin.startEmoji(),
};
const viewState = createEditorViewState('Hello ReactEditor!');

const ribbonButtons = [
    'emoji',
    'bold',
    'italic',
    'underline',
    'font',
    'size',
    'bkcolor',
    'color',
    'bullet',
    'number',
    'indent',
    'outdent',
    'quote'
];

class SampleEditor extends React.Component<ISampleEditorProps, {}> {
  render() {

    return (
        <div>
        <Ribbon
            ribbonPlugin={ribbonPlugin}
            className={'myRibbon'}
            buttonRenderer={ribbonButtonRenderer}
            buttonNames={ribbonButtons}
            additionalButtons={{ emoji: emojiButton }}
        />
        <ReactEditor className={'editor'} viewState={viewState} plugins={[ribbonPlugin, emojiPlugin]} />
      </div>
    );
  }
}   

export const SampleEditorContainer = ({
    text,
}) => {
    return <div className="editor-container"><SampleEditor text={text} limit={20} /></div>;
};
