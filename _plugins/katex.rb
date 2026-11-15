# https://gist.github.com/jackwillis/e4842a6d6fbc6ed438e813d2d2753eb8

# Uses mini_racer (in-process V8) directly rather than ExecJS: ExecJS's Node
# runtime spawns a fresh `node` per call, and this hook makes one call per math
# expression, so a math-heavy post cost seconds of process-spawn overhead.
require 'cgi'
require 'mini_racer'
require_relative 'equations'
require_relative 'tex_source'

module Katex
  JS_FILENAME = 'vendor/katex.min.js'
  JS_CTX = MiniRacer::Context.new
  JS_CTX.eval(File.read(JS_FILENAME))
  # Trust only what equations.rb emits (anchors and same-page links) and CSS
  # classes (e.g. for the \explain arrow).
  JS_CTX.eval(<<~'JS')
    function render(tex, options) {
      options.trust = (c) => c.command === '\\htmlId' || c.command === '\\htmlClass'
        || (c.command === '\\href' && c.url.startsWith('#'));
      return katex.renderToString(tex, options);
    }
  JS

  # Tried in order at each position (\x60 is a backtick):
  #   code:    `...`, ``...`` or ```...``` fences, left untouched
  #   escaped: \$ or \\$, becomes a literal dollar sign
  #   display: $$...$$
  #   inline:  $...$
  TOKEN_REGEX = /(?<code>(?<ticks>\x60+).*?\k<ticks>)|(?<escaped>\\{1,2}\$)|\$\$(?<display>.*?)\$\$|\$(?<inline>.*?)\$/m.freeze

  class << self
    def process(text, macros)
      text.gsub(TOKEN_REGEX) do
        m = Regexp.last_match
        if m[:code]
          m[0]
        elsif m[:escaped]
          '&#36;'
        elsif m[:display]
          render_display(m[:display], macros)
        else
          render_inline(m[:inline], macros)
        end
      end
    end

    def render_inline(text, macros)
      with_source(JS_CTX.call('render', text, { macros: macros }), text, macros)
    end

    def render_display(text, macros)
      with_source(JS_CTX.call('render', text, { macros: macros, displayMode: true }), text, macros)
    end

    # The TeX for copying (see tex_source.rb) on the outermost element. Newlines as
    # entities, so that the HTML stays on one line for Markdown.
    def with_source(html, text, macros)
      source = CGI.escapeHTML(TexSource.for_copy(text, macros)).gsub("\n", '&#10;')
      html.sub(/\A<span class="katex(?:-display)?"/) { |tag| %(#{tag} data-tex="#{source}") }
    end

    # The page's macros plus the site-wide ones that the text (or a page macro)
    # uses, so KaTeX does not get the others. Also returns the names of the latter.
    def macros_for(text, page_macros, site_macros)
      haystack = text + page_macros.values.join
      used = site_macros.select { |name, _| haystack.match?(/#{Regexp.escape(name)}(?![a-zA-Z])/) }
      [used.merge(page_macros), used.keys]
    end
  end
end

pre_render_task = lambda { |doc, _|
  katex = doc.data['katex']
  next unless katex && katex['enabled']

  content = Equations.process(doc.content, doc.relative_path)
  site_macros = doc.site.config.dig('katex', 'macros') || {}
  macros, used = Katex.macros_for(content, katex['macros'] || {}, site_macros)
  # Lets the layout link the stylesheets of used site-wide macros, e.g. \explain.
  doc.data['katex_site_macros'] = used
  doc.content = Katex.process(content, macros)
}

Jekyll::Hooks.register(:blog, :pre_render, &pre_render_task)
Jekyll::Hooks.register(:pages, :pre_render, &pre_render_task)
Jekyll::Hooks.register(:store, :pre_render, &pre_render_task)
