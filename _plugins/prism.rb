require 'execjs'

module Prism
  class << self
    JS_FILENAME = 'vendor/prism.js'
    JS_CTX = ::ExecJS.compile(File.read(JS_FILENAME))

    # Jekyll wraps code blocks in <pre><code> tags
    CODE_REGEX = /<pre><code(.*?)class="language-(.*?)"(.*?)>(.*?)<\/code><\/pre>/m.freeze
    FILENAME_REGEX = /(.*)\+\+\+FILENAME\+\+\+\s*(.*)/.freeze

    def process(text)
      text.gsub(CODE_REGEX) { 
        language = $2
        code_block = $4
        filename = extract_filename!(code_block)
        wrap_in_figure("<code#{$1}class=\"language-#{language}\"#{$3}>#{render_code(language, code_block) }</code>",
                      filename, language)
      }
    end
    
    def render_code(language, code)
      JS_CTX.eval("Prism.highlight(`#{code}`, Prism.languages.#{language}, '#{language}')")
    end

    def extract_filename!(code)
      filename = nil
      code.gsub!(FILENAME_REGEX) { filename = $2; '' }
      filename
    end

    def wrap_in_figure(code, filename, language)
      template = File.read('_plugins/code_figure.html')
      template = template.gsub('{{ code }}', "<pre tabindex='0'>#{code}</pre>")
      template.gsub('{{ figcaption }}', filename\
        ? "<figcaption class=\"code-caption\">#{filename}</figcaption>"
        : "<figcaption class=\"only-aria\">Code snippet (programming language: #{language})</figcaption>")
    end
  end
end

task = lambda { |doc|
    doc.content = Prism.process(doc.content)
}

Jekyll::Hooks.register(:posts, :post_convert, &task)
Jekyll::Hooks.register(:pages, :post_convert, &task)
