# Builds a table of contents from the <h2> headings of a rendered post.
#
# Opt-in per post with `table_of_contents: true` in the front matter;
# `_layouts/page.html` then renders `{{ content | table_of_contents }}` next to the
# article. Kramdown gives every heading an id, which the entries link to.
module TableOfContents
  HEADING = %r{<h2\b[^>]*\bid="([^"]+)"[^>]*>(.*?)</h2>}m

  class << self
    def render(html)
      entries = html.to_s.scan(HEADING).map do |id, title|
        %(<li><a href="##{id}">#{link_free(title).strip}</a></li>)
      end
      return '' if entries.empty?

      %(<nav class="toc" aria-label="Table of contents"><ol>#{entries.join}</ol></nav>)
    end

    private

    # Links can't nest, so keep only the text of links inside a heading.
    def link_free(title) = title.gsub(%r{</?a\b[^>]*>}, '')
  end

  module Filter
    def table_of_contents(html) = TableOfContents.render(html)
  end
end

Liquid::Template.register_filter(TableOfContents::Filter) if defined?(Liquid::Template)
