export async function POST(request: Request) {
  const apiKey = process.env.IMGBB_API_KEY

  if (!apiKey) {
    return Response.json(
      { error: "Image upload is not configured on the server." },
      { status: 500 },
    )
  }

  let formData: FormData
  try {
    formData = await request.formData()
  } catch {
    return Response.json(
      { error: "The image upload request is invalid." },
      { status: 400 },
    )
  }

  const image = formData.get("image")
  if (
    !(image instanceof File) ||
    image.size === 0 ||
    image.size > 32 * 1024 * 1024 ||
    !image.type.startsWith("image/")
  ) {
    return Response.json(
      { error: "Choose an image smaller than 32 MB." },
      { status: 400 },
    )
  }

  const uploadData = new FormData()
  uploadData.set("image", image)

  let response: Response
  try {
    response = await fetch(
      `https://api.imgbb.com/1/upload?key=${encodeURIComponent(apiKey)}`,
      { method: "POST", body: uploadData },
    )
  } catch {
    return Response.json(
      { error: "Could not connect to the image upload service." },
      { status: 502 },
    )
  }

  let result: unknown
  try {
    result = await response.json()
  } catch {
    return Response.json(
      { error: "The image upload service returned an invalid response." },
      { status: 502 },
    )
  }

  if (
    !response.ok ||
    typeof result !== "object" ||
    result === null ||
    !("success" in result) ||
    result.success !== true ||
    !("data" in result) ||
    typeof result.data !== "object" ||
    result.data === null ||
    !("url" in result.data) ||
    typeof result.data.url !== "string"
  ) {
    return Response.json(
      { error: "Image upload failed. Check the ImgBB API key and try again." },
      { status: 502 },
    )
  }

  return Response.json({ url: result.data.url })
}
