# `_store/<slug>/index.md` (or `index.html`, for a product page written as plain
# HTML instead of Markdown) sits right next to the assets it references. We infer
# `slug` and `permalink` from that folder path.

INDEX_FILENAMES = ["index.md", "index.html"].freeze

# Returns the slug for a `_store/<slug>/index.{md,html}` document, else nil.
def store_bundle_slug(doc)
  segments = doc.relative_path.sub(%r{\A\.?/?_store/}, "").split("/")
  segments[0] if segments.length == 2 && INDEX_FILENAMES.include?(segments.last)
end

Jekyll::Hooks.register :store, :post_init do |doc|
  slug = store_bundle_slug(doc)
  next unless slug

  doc.data["slug"]      ||= slug
  doc.data["permalink"] ||= "/store/#{slug}/"
end
