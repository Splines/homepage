# https://gist.github.com/jackwillis/e4842a6d6fbc6ed438e813d2d2753eb8
require 'execjs'

module Katex
  class << self
    JS_FILENAME = 'vendor/katex.min.js'
    JS_CTX = ::ExecJS.compile(File.read(JS_FILENAME))

    INLINE_REGEX = /\$(.*?)\$/m.freeze
    DISPLAY_REGEX = /\$\$(.*?)\$\$/m.freeze

    def process(text, macros)
      text
        .gsub(DISPLAY_REGEX) { render_display($1, macros) }
        .gsub(INLINE_REGEX) { render_inline($1, macros) }
    end

    def render_inline(text, macros)
      JS_CTX.call('katex.renderToString', text, macros: macros)
    end

    def render_display(text, macros)
      JS_CTX.call('katex.renderToString', text, macros: macros, displayMode: true)
    end

  end
end

pre_render_task = lambda { |doc, _|
  if doc.data['katex'] && doc.data['katex']['enabled']
    doc.content = Katex.process(doc.content, doc.data['katex']['macros'] || [])
  end
}

Jekyll::Hooks.register(:posts, :pre_render, &pre_render_task)
Jekyll::Hooks.register(:pages, :pre_render, &pre_render_task)
