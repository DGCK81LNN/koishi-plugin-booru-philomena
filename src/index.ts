import { Context, difference, intersection, Random, Schema } from "koishi"
import { ImageSource } from "koishi-plugin-booru"

import { Philomena } from "./types"
import { resolve } from "url"

function formatTruncatedList(list: string[]) {
  return list.slice(0, 10).join(", ") + (list.length > 7 ? " ..." : "")
}

class PhilomenaImageSource extends ImageSource<PhilomenaImageSource.Config> {
  static readonly name = "booru-philomena"

  languages: string[] = ["en"]

  constructor(ctx: Context, config: PhilomenaImageSource.Config) {
    super(ctx, config)
  }

  override tokenize(query: string): string[] {
    return query
      .split(",")
      .map(x => x.trim())
      .filter(Boolean)
      .map(x => x.toLowerCase().replace(/\s+/g, " "))
  }

  async get(query: ImageSource.Query): Promise<ImageSource.Result[]> {
    this.ctx.logger.debug("query", query)
    const params: Philomena.Request = {
      q:
        `(${query.tags.join(", ")}),(${this.config.restrictions.trim() || "*"})` +
        this.config.disallowRatings.map(r => ", -" + r).join(""),
      filter_id: this.config.filterId,
      per_page: query.count,
      sf: `random:${Random.int(0, 0x1_0000_0000)}`,
    }
    this.ctx.logger.debug("params", params)
    const resp = await this.http.get<Philomena.Response>(
      resolve(this.config.endpoint, "api/v1/json/search/images"),
      { params }
    )
    this.ctx.logger.debug("response", resp)
    if (!resp?.images?.length) return
    const results = resp.images.map(
      image =>
        ({
          urls: {
            // https://github.com/philomena-dev/philomena/blob/4af107c6068c6ecd159a94284e67cbd6b06a9cb9/lib/philomena/images/thumbnailer.ex#L18-L26
            original: image.representations.full,
            large: image.representations.large,
            medium: image.representations.medium,
            small: image.representations.small,
            thumbnail: image.representations.thumb_small,
          },
          title: formatTruncatedList(image.tags),
          desc: image.description,
          author:
            formatTruncatedList(
              image.tags
                .map(tag => tag.match(/^(?:artist|editor|photographer):(.*)$/s)?.[1])
                .filter(Boolean)
                .sort()
            ) || "(不详)",
          nsfw:
            intersection(image.tags, ["grimdark", "grotesque"]).length > 0
              ? "guro"
              : intersection(image.tags, ["questionable", "explicit"]).length > 0,
          tags: image.tags,
          pageUrl: resolve(this.config.endpoint, `images/${image.id}`),
        } as ImageSource.Result)
    )
    this.ctx.logger.debug("results", results)
    return results
  }
}

namespace PhilomenaImageSource {
  export const nsfwRatings = [
    "suggestive",
    "questionable",
    "explicit",
    "semi-grimdark",
    "grimdark",
    "grotesque",
  ] as const
  export type NsfwRating = (typeof nsfwRatings)[number]

  export interface Config extends ImageSource.Config {
    endpoint: string
    filterId: number
    disallowRatings: NsfwRating[]
    restrictions: string
  }

  export const Config: Schema<Config> = Schema.intersect([
    ImageSource.createSchema({ label: "derpibooru" }),
    Schema.object({
      endpoint: Schema.string()
        .description("图站网址。")
        .default("https://trixiebooru.org/"),
      filterId: Schema.number()
        .description(
          "图片过滤器编号。被此过滤器隐藏（hide）的图片不会出现在随机结果中。" +
            "**使用 Derpibooru 以外的图站请修改此值**：" +
            "前往图站的 `/filters` 页面查看一个过滤器，然后复制网址中的编号。"
        )
        .default(191275),
      disallowRatings: Schema.array(Schema.union(nsfwRatings))
        .role("checkbox")
        .description("不允许出现的评级。")
        .default(["questionable", "explicit", "grimdark", "grotesque"]),
      restrictions: Schema.string()
        .role("textarea")
        .description("随机图片必须满足的其他条件。")
        .default("wilson_score.gte:0.93"),
    }).description("搜索设置"),
  ] satisfies Schema[])
}

export default PhilomenaImageSource
