# Collapses kramdown's footnotes at the end of a page into a <details> element.
#
# Readers see footnotes in a preview when hovering or tapping a reference (see
# `assets/vite/entrypoints/ref-preview.ts`), so the list at the bottom stays closed by
# default. `assets/vite/entrypoints/footnotes.ts` opens it whenever a link or the URL
# points into it.
module Footnotes
  # Kramdown appends the footnotes as the very last element of the converted content.
  BLOCK = %r{<div class="footnotes" role="doc-endnotes">.*\z}m

  class << self
    def collapse(html)
      html.sub(BLOCK) do |footnotes|
        count = footnotes.scan(/<li id="fn:/).size
        %(<details class="footnotes-details"><summary>Footnotes ) +
          %(<span class="footnotes-count">(#{count})</span></summary>\n) +
          %(#{footnotes.rstrip}\n</details>\n)
      end
    end
  end
end

if defined?(Jekyll::Hooks)
  task = lambda { |doc|
    doc.content = Footnotes.collapse(doc.content)
  }

  Jekyll::Hooks.register(:blog, :post_convert, &task)
  Jekyll::Hooks.register(:pages, :post_convert, &task)
  Jekyll::Hooks.register(:store, :post_convert, &task)
end
