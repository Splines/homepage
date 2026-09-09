# `_store/<slug>/index.md` sits right next to the assets it references.
# We infer `slug` and `permalink` from that folder path.

# Returns the slug for a `_store/<slug>/index.md` document, else nil.
def store_bundle_slug(doc)
  segments = doc.relative_path.sub(%r{\A\.?/?_store/}, "").split("/")
  segments[0] if segments.length == 2 && segments.last == "index.md"
end

Jekyll::Hooks.register :store, :post_init do |doc|
  slug = store_bundle_slug(doc)
  next unless slug

  doc.data["slug"]      ||= slug
  doc.data["permalink"] ||= "/store/#{slug}/"
end
