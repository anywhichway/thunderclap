addEventListener('fetch', event => {
  event.respondWith(handleRequest(event.request))
})

async function handleRequest(request) {
  const value = await NAMESPACE.get("test")
  if (value === null) {
    await NAMESPACE.put("test","test");
    return new Response("Value not found", {status: 404})
  }

  return new Response(value)
}