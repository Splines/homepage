# `_blog/<year>/<slug>/index.md` sits right next to the assets it references.
# We infer `slug` and `permalink` from that folder path.

# Returns [year, slug] for a `_blog/<year>/<slug>/index.md` document, else nil.
def blog_bundle_parts(doc)
  segments = doc.relative_path.sub(%r{\A\.?/?_blog/}, "").split("/")
  segments[0, 2] if segments.length == 3 && segments.last == "index.md"
end

Jekyll::Hooks.register :blog, :post_init do |doc|
  year, slug = blog_bundle_parts(doc)
  next unless slug

  doc.data["slug"]      ||= slug
  doc.data["permalink"] ||= "/blog/#{year}/#{slug}/"
end

# Guard against empty `date:` front matter in blog posts.
class BlogDateGuard < Jekyll::Generator
  priority :high

  def generate(site)
    undated = site.collections["blog"]&.docs&.reject { |doc| doc.data["date"] } || []
    return if undated.empty?

    list = undated.map { |doc| "  - #{doc.relative_path}" }.join("\n")
    raise "Blog post(s) missing a `date:` in front matter:\n#{list}"
  end
end
