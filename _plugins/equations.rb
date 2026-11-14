# Typst-style equation labels and references, resolved before KaTeX renders:
#
#   $$ E = mc^2 $$ <eq:energy>   display math with a label gets a number
#   see @eq:energy               becomes a link "(1)", also inside math
#
# Only labeled equations are numbered (in order of appearance), unlabeled ones
# don't advance the counter. References may point forward. Labels that are
# never referenced, unknown references and duplicate labels are reported as
# grouped warnings.
module Equations
  # A label must not end in "." or ":", so "see @eq:energy." works.
  NAME = /eq:[\w-]+(?:[:.][\w-]+)*/.freeze
  LABEL_AFTER = /\G[ \t]*<(#{NAME})>/.freeze
  REF = /@(#{NAME})/.freeze
  EXCERPT_LENGTH = 50

  class << self
    def process(text, path)
      equations = collect(text)
      numbers = {}
      equations.each { |eq| numbers[eq[:name]] ||= eq[:number] }
      refs = Hash.new(0)
      stray = []

      result = text.gsub(token_regex) do
        m = Regexp.last_match
        if m[:display]
          tex = link_refs(m[:display], numbers, refs)
          eq = equations.find { |e| e[:pos] == m.end(0) }
          tex += " \\tag{#{tag(eq, numbers)}}" if eq
          "$$#{tex}$$"
        elsif m[:inline]
          "$#{link_refs(m[:inline], numbers, refs)}$"
        elsif m[:ref]
          refs[m[:ref]] += 1
          prose_ref(m[:ref], numbers)
        elsif m[:label]
          next '' if equations.any? { |e| e[:pos] == m.begin(0) }

          stray << "<#{m[:label]}>"
          m[0]
        else
          m[0]
        end
      end

      warn_about(path, equations, numbers, refs)
      report(path, 'label not after display math', stray)
      result
    end

    private

    # Katex's own tokens (so code and dollars are split the same way), plus
    # references and labels outside of math. Built lazily, so the load order
    # of the plugin files does not matter.
    def token_regex
      @token_regex ||= /#{Katex::TOKEN_REGEX}|@(?<ref>#{NAME})|[ \t]*<(?<label>#{NAME})>/m
    end

    # Labeled display equations in order, with the position of their label.
    def collect(text)
      equations = []
      text.scan(token_regex) do
        m = Regexp.last_match
        next unless m[:display] && (label = text.match(LABEL_AFTER, m.end(0)))

        equations << { name: label[1], number: equations.size + 1, tex: m[:display], pos: m.end(0) }
      end
      equations
    end

    def id(name) = name.tr(':.', '--')

    # Only the first equation with a label gets the anchor, ids must be unique.
    def tag(equation, numbers)
      number = equation[:number]
      numbers[equation[:name]] == number ? "\\htmlId{#{id(equation[:name])}}{#{number}}" : number.to_s
    end

    def link_refs(tex, numbers, refs)
      tex.gsub(REF) do
        name = Regexp.last_match(1)
        refs[name] += 1
        numbers[name] ? "\\href{##{id(name)}}{(#{numbers[name]})}" : '\textbf{(??)}'
      end
    end

    def prose_ref(name, numbers)
      return '<strong class="eq-ref-missing">(??)</strong>' unless numbers[name]

      %(<a class="eq-ref" href="##{id(name)}">(#{numbers[name]})</a>)
    end

    def warn_about(path, equations, numbers, refs)
      first = equations.select { |eq| numbers[eq[:name]] == eq[:number] }
      report(path, 'label never referenced', first.reject { |eq| refs.key?(eq[:name]) })
      report(path, 'duplicate label', equations - first)

      unknown = refs.keys.reject { |name| numbers.key?(name) }
      report(path, 'unknown reference', unknown.map { |name| "@#{name}" + (refs[name] > 1 ? " (#{refs[name]}×)" : '') })
    end

    # One block per problem: a summary line, then one line per item.
    def report(path, problem, items)
      return if items.empty?

      noun = items.size == 1 ? problem : problem.sub(/^(\w+)/, '\1s')
      Jekyll.logger.warn('Equations:', "#{items.size} #{noun} in #{path}")
      items.each { |item| Jekyll.logger.warn('', item.is_a?(Hash) ? describe(item) : item) }
    end

    # Jekyll's logger squeezes whitespace, so no column alignment here.
    def describe(equation)
      "(#{equation[:number]}) <#{equation[:name]}> #{excerpt(equation[:tex])}"
    end

    def excerpt(tex)
      flat = tex.gsub(/\\(?:begin|end)\{\w+\*?\}|&|\\\\/, ' ').gsub(/\s+/, ' ').strip
      flat.size > EXCERPT_LENGTH ? "#{flat[0, EXCERPT_LENGTH].rstrip}…" : flat
    end
  end
end
