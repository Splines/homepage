# https://gist.github.com/jackwillis/e4842a6d6fbc6ed438e813d2d2753eb8

# Uses mini_racer (in-process V8) directly rather than ExecJS: ExecJS's Node
# runtime spawns a fresh `node` per call, and this hook makes one call per math
# expression, so a math-heavy post cost seconds of process-spawn overhead.
require 'mini_racer'

module Katex
  class << self
    JS_FILENAME = 'vendor/katex.min.js'
    JS_CTX = MiniRacer::Context.new
    JS_CTX.eval(File.read(JS_FILENAME))

    # Tried in order at each position (\x60 is a backtick):
    #   code:    `...`, ``...`` or ```...``` fences, left untouched
    #   escaped: \$ or \\$, becomes a literal dollar sign
    #   display: $$...$$
    #   inline:  $...$
    TOKEN_REGEX = /(?<code>(?<ticks>\x60+).*?\k<ticks>)|(?<escaped>\\{1,2}\$)|\$\$(?<display>.*?)\$\$|\$(?<inline>.*?)\$/m.freeze

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
      JS_CTX.call('katex.renderToString', text, { macros: macros })
    end

    def render_display(text, macros)
      JS_CTX.call('katex.renderToString', text, { macros: macros, displayMode: true })
    end

  end
end

pre_render_task = lambda { |doc, _|
  if doc.data['katex'] && doc.data['katex']['enabled']
    doc.content = Katex.process(doc.content, doc.data['katex']['macros'] || {})
  end
}

Jekyll::Hooks.register(:blog, :pre_render, &pre_render_task)
Jekyll::Hooks.register(:pages, :pre_render, &pre_render_task)
Jekyll::Hooks.register(:store, :pre_render, &pre_render_task)
