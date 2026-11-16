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
  # Where the post's assets are served. Differs from the post's URL for drafts.
  doc.data["bundle_url"] = "/blog/#{year}/#{slug}/"
end

# Drafts appear in the landing page's post list only for a local `jekyll serve`
# (e.g. via `bin/dev`), so their excerpt can be previewed. A `jekyll build` never
# lists them, whatever the environment.
def show_drafts_in_lists?(site)
  site.config["serving"] == true && Jekyll.env != "production"
end

Jekyll::Hooks.register :site, :pre_render do |site, payload|
  payload["site"]["show_drafts_in_lists"] = show_drafts_in_lists?(site)
end

# Safety net for deploys: fail the production build if a draft's URL ended up
# on the landing page anyway.
Jekyll::Hooks.register :pages, :post_render do |page|
  next unless Jekyll.env == "production" && page.url == "/"

  drafts = page.site.collections["blog"]&.docs&.select { |doc| doc.data["draft"] } || []
  leaked = drafts.select { |doc| page.output.include?(%(href="#{doc.url}")) }
  next if leaked.empty?

  list = leaked.map { |doc| "  - #{doc.relative_path}" }.join("\n")
  raise "Draft(s) listed on the landing page in a production build:\n#{list}"
end

# Guard against empty `date:` front matter in published blog posts.
# Drafts (`draft: true`) may leave the date out until they are published.
class BlogDateGuard < Jekyll::Generator
  priority :high

  def generate(site)
    docs = site.collections["blog"]&.docs || []
    undated = docs.reject { |doc| doc.data["draft"] || doc.data["date"] }
    return if undated.empty?

    list = undated.map { |doc| "  - #{doc.relative_path}" }.join("\n")
    raise "Blog post(s) missing a `date:` in front matter:\n#{list}"
  end
end
