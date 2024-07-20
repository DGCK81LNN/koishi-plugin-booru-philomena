export namespace Philomena {
  export type Size =
    | "full"
    | "large"
    | "medium"
    | "small"
    | "tall"
    | "thumb"
    | "thumb_small"
    | "thumb_tiny"

  export interface Request {
    filter_id?: number
    key?: string
    page?: number
    per_page?: number
    q?: string
    sd?: "desc" | "asc"
    sf?: string
  }

  export interface Image {
    animated: boolean
    aspect_ratio: number
    comment_count: number
    created_at: string
    deletion_reason: null | string
    description: string
    downvotes: number
    duplicate_of: null | number
    duration: number
    faves: number
    first_seen_at: string
    format: string
    height: number
    hidden_from_users: false
    id: number
    intensities: null | {
      ne: number
      nw: number
      se: number
      sw: number
    }
    mime_type: string
    name: string
    orig_sha512_hash: string
    processed: boolean
    representations: Record<Size, string>
    score: number
    sha512_hash: string
    size: number
    source_url: string
    spoilered: boolean
    tag_count: number
    tag_ids: number[]
    tags: string[]
    thumbnails_generated: boolean
    updated_at: string
    uploader: string
    uploader_id: null | number
    upvotes: number
    view_url: string
    width: number
    wilson_score: number
  }

  export interface Response {
    images: Image[]
    total: number
  }
}
