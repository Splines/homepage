# The TeX of an equation as readers get it when copying (see math-selection.ts):
# without our own macros, which they cannot use anyway.
#
# - macros (site-wide and the page's) are expanded, e.g. \pdv{f}{x} becomes
#   \frac{\partial f}{\partial x}
# - \explain rows become comment lines
# - the equation number from equations.rb is dropped, references to other
#   equations become plain "(5)"
module TexSource
  # guards against macros that (indirectly) use themselves
  MAX_DEPTH = 20

  class << self
    def for_copy(tex, macros)
      tex = tex.sub(/\s*\\tag\{(?:\\htmlId\{[^{}]*\})?\{?\d+\}?\}\s*\z/, '')
      tex = tex.gsub(/\\href\{#[^{}]*\}\{(\(\d+\))\}/, '\1')
      expand(comment_explanations(tex, macros), macros).strip
    end

    private

    def expand(tex, macros, depth = 0)
      raise "Macros nested too deeply in: #{tex}" if depth > MAX_DEPTH

      out = +''
      i = 0
      while i < tex.size
        command = tex.match(/\G\\(?:[a-zA-Z]+|.)/m, i)
        unless command
          out << tex[i]
          i += 1
          next
        end

        i = command.end(0)
        body = macros[command[0]]
        unless body
          out << command[0]
          next
        end

        args = []
        body.scan(/#(\d)/).flatten.map(&:to_i).max.to_i.times do
          arg, i = read_arg(tex, i)
          args << arg
        end
        out << expand(substitute(body, args), macros, depth + 1)
      end
      out
    end

    # Puts the arguments in for #1, #2, ... A space keeps a control word and a
    # following letter apart, e.g. "\partial#1" with "x" becomes "\partial x".
    def substitute(body, args)
      body.gsub(/(\\[a-zA-Z]+)?#(\d)/) do
        command = Regexp.last_match(1)
        arg = args[Regexp.last_match(2).to_i - 1]
        command && arg.match?(/\A[a-zA-Z]/) ? "#{command} #{arg}" : "#{command}#{arg}"
      end
    end

    # A macro argument at position i: a group in braces (without them), a
    # command or a single character. Returns it and the position after it.
    def read_arg(tex, i)
      i = tex.match(/\G\s*/, i).end(0)
      unless tex[i] == '{'
        token = tex.match(/\G(?:\\(?:[a-zA-Z]+|.)|.)/m, i)&.[](0) || ''
        return [token, i + token.size]
      end

      depth = 0
      j = i
      while j < tex.size
        case tex[j]
        when '\\' then j += 1 # skip the escaped character, e.g. \{
        when '{' then depth += 1
        when '}'
          depth -= 1
          return [tex[(i + 1)...j], j + 1] if depth.zero?
        end
        j += 1
      end
      raise "Unbalanced braces in: #{tex}"
    end

    # "  &\explain{\text{Hamilton: } a = b} \\" becomes "  % Hamilton: a = b",
    # one comment line per line of the explanation.
    def comment_explanations(tex, macros)
      out = +''
      while (m = tex.match(/^([ \t]*)&?[ \t]*\\explain(?![a-zA-Z])/))
        explanation, i = read_arg(tex, m.end(0))
        i = tex.match(/\G[ \t]*(?:\\\\)?[ \t]*\n?/, i).end(0)
        lines = explanation.split('\\\\').map do |line|
          text = expand(line, macros).gsub(/\\text\{([^{}]*)\}/, '\1').squeeze(' ').strip
          "#{m[1]}% #{text}\n"
        end
        out << tex[0...m.begin(0)] << lines.join
        tex = tex[i..]
      end
      out + tex
    end
  end
end
