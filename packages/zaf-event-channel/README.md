# ZAF Proxy Client

用于实现在 ZendeskApp 中集成 Iframe 场景下，Iframe 页面对 zendeskApp client 的调用代理

> 底层是通过在 zendeskApp 与 admin 中注册 message 事件通道，通过 postMessage 进行双向通信

# Usage

```tsx
// ----- Admin -----
const clientProxy = new ZAFClientProxy({
  debug: true,
})

clientProxy.request('/api/v2/tickets.json').then((tickets) => {
  // tickets info...
})

// ---- Zendesk app in react ----
const Wrap = ({ client }) => {
  /**
   * @type {React.MutableRefObject<HTMLIFrameElement>}
   */
  const iframeRef = useRef(null)

  useEffect(() => {
    if (iframeRef.current) {
      initZAFEventChannel({
        client,
        frame: iframeRef.current,
      })
    }
  }, [iframeRef.current])

  return (
    <div>
      <iframe
        ref={iframeRef}
        name='iframe'
        src='http://localhost:9528/iframe/panel'
        style={{
          border: 'none',
          width: 376,
          height: 600,
        }}
      />
    </div>
  )
}
```
