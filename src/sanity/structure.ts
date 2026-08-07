import { DocumentIcon } from "@sanity/icons";
import type {
  StructureBuilder,
  StructureResolver,
  StructureResolverContext,
} from "sanity/structure";

/** シングルトン（1件固定）のドキュメント型。通常リストから除外する */
const SINGLETON_SCHEMA_TYPES = new Set(["article-set"]);

const POST_API_VERSION = "2024-01-01";

/** 公開済み（published レコードが存在する）記事の _id 一覧 */
const PUBLISHED_IDS_QUERY = `*[_type == "post" && !(_id in path("drafts.**"))]._id`;

/** 未公開（drafts.* のみ存在）記事の _id 一覧（drafts. 付き） */
const DRAFT_ONLY_IDS_QUERY = `*[_type == "post" && _id in path("drafts.**") && !defined(*[_id == string::split(^._id, "drafts.")[1]][0])]._id`;

type PostFilterSpec = {
  id: string;
  title: string;
  filter?: string;
  params?: Record<string, unknown>;
  /** true のとき Sanity 標準の記事一覧（下書きバッジ付き） */
  useDefaultList?: boolean;
};

async function fetchPostFilterParams(context: StructureResolverContext) {
  const client = context.getClient({ apiVersion: POST_API_VERSION });
  const [publishedIds, draftOnlyRawIds] = await Promise.all([
    client.fetch<string[]>(PUBLISHED_IDS_QUERY, {}, { perspective: "raw" }),
    client.fetch<string[]>(DRAFT_ONLY_IDS_QUERY, {}, { perspective: "raw" }),
  ]);

  // Studio の drafts 視点では _id に drafts. が付かないため、ベース ID に揃える
  const draftOnlyBaseIds = draftOnlyRawIds.map((id) =>
    id.replace(/^drafts\./, ""),
  );

  return { publishedIds, draftOnlyBaseIds };
}

function postFilterListItem(S: StructureBuilder, spec: PostFilterSpec) {
  const child = spec.useDefaultList
    ? S.documentTypeList("post")
        .id(`${spec.id}-list`)
        .title(spec.title)
        .defaultOrdering([{ field: "publishedAt", direction: "desc" }])
    : S.documentList()
        .id(`${spec.id}-list`)
        .title(spec.title)
        .schemaType("post")
        .apiVersion(POST_API_VERSION)
        .filter(spec.filter!)
        .params(spec.params ?? {})
        .defaultOrdering([
          {
            field: spec.id === "post-drafts" ? "_updatedAt" : "publishedAt",
            direction: "desc",
          },
        ]);

  return S.listItem()
    .title(spec.title)
    .id(spec.id)
    .child(child);
}

function postsStructureItem(
  S: StructureBuilder,
  params: { publishedIds: string[]; draftOnlyBaseIds: string[] },
) {
  const postFilters: PostFilterSpec[] = [
    { id: "post-all", title: "すべて", useDefaultList: true },
    {
      id: "post-published",
      title: "公開済み",
      filter: '_type == "post" && _id in $publishedIds',
      params: { publishedIds: params.publishedIds },
    },
    {
      id: "post-drafts",
      title: "下書き（未公開）",
      filter: '_type == "post" && _id in $draftOnlyBaseIds',
      params: { draftOnlyBaseIds: params.draftOnlyBaseIds },
    },
  ];

  return S.listItem()
    .title("記事")
    .id("post")
    .icon(DocumentIcon)
    .child(
      S.list()
        .id("post-filters")
        .title("記事")
        .items(postFilters.map((spec) => postFilterListItem(S, spec))),
    );
}

export const structure: StructureResolver = async (S, context) => {
  const { publishedIds, draftOnlyBaseIds } = await fetchPostFilterParams(context);

  return S.list()
    .id("content")
    .title("コンテンツ")
    .items([
      S.documentListItem()
        .id("website-featured-articles")
        .schemaType("article-set")
        .title("サイト設定"),
      postsStructureItem(S, { publishedIds, draftOnlyBaseIds }),
      ...S.documentTypeListItems().filter((item) => {
        const id = item.getId() ?? "";
        return !SINGLETON_SCHEMA_TYPES.has(id) && id !== "post";
      }),
    ]);
};
