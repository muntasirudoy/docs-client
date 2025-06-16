import { WebsocketProvider } from "y-websocket";
import { Awareness } from "y-protocols/awareness";
import * as Y from "yjs";
import {
  ySyncPlugin,
  yCursorPlugin as yCursors,
  yUndoPlugin,
  undo,
  redo,
} from "y-prosemirror";
import { Extension } from "@tiptap/core";

export const yjsPlugin = (yXmlFragment: Y.XmlFragment) => {
  return Extension.create({
    name: "yjs",
    addProseMirrorPlugins() {
      return [ySyncPlugin(yXmlFragment), yUndoPlugin()];
    },
  });
};

export const yCursorPlugin = (
  awareness: Awareness,
  user?: { _id: string; fullName: string; avatar?: string }
) => {
  if (user) {
    awareness.setLocalStateField("user", {
      name: user.fullName,
      color: stringToColor(user._id),
      avatar: user.avatar || "",
    });
  }

  return Extension.create({
    name: "yCursor",
    addProseMirrorPlugins() {
      return [yCursors(awareness)];
    },
  });
};

function stringToColor(str: string) {
  let hash = 0;
  for (let i = 0; i < str.length; i++) {
    hash = str.charCodeAt(i) + ((hash << 5) - hash);
  }
  let color = "#";
  for (let i = 0; i < 3; i++) {
    const value = (hash >> (i * 8)) & 0xff;
    color += ("00" + value.toString(16)).slice(-2);
  }
  return color;
}
