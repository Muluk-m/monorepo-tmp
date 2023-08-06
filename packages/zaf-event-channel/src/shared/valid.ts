export function isValidEventByParent(event: MessageEvent, parent: Window) {
  return event && event.source === parent
}

export function isValidEventByFrame(event: MessageEvent, frame: HTMLIFrameElement | null) {
  return event && frame && event.source === frame.contentWindow
}
