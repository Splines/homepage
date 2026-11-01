require 'jekyll'
require_relative '../_plugins/katex'

RSpec.describe Katex do
  def process(text) = Katex.process(text, {})
  def inline(tex) = Katex.render_inline(tex, {})
  def display(tex) = Katex.render_display(tex, {})

  describe 'escaped dollar signs' do
    it 'turns \$ into a literal dollar' do
      expect(process('ABC \$3.99')).to eq('ABC &#36;3.99')
    end

    it 'turns \\\\$ into a literal dollar' do
      expect(process('ABC \\\\$3.99')).to eq('ABC &#36;3.99')
    end

    it 'handles several escapes on one line' do
      expect(process('from \$3 to \$5')).to eq('from &#36;3 to &#36;5')
    end

    it 'does not interfere with math next to it' do
      expect(process('costs \$3, so $x$')).to eq("costs &#36;3, so #{inline('x')}")
    end
  end

  describe 'math' do
    it 'renders inline math' do
      expect(process('a $x^2$ b')).to eq("a #{inline('x^2')} b")
    end

    it 'renders display math' do
      expect(process("a\n$$\\sum_i x_i$$\nb")).to eq("a\n#{display('\sum_i x_i')}\nb")
    end

    it 'renders display math spanning several lines' do
      expect(process("$$\na\n+b\n$$")).to eq(display("\na\n+b\n"))
    end

    it 'keeps backslash commands intact' do
      expect(process('$\{a\}$')).to eq(inline('\{a\}'))
      expect(process('$\alpha + \beta$')).to eq(inline('\alpha + \beta'))
    end

    it 'leaves text without dollars untouched' do
      expect(process('plain text')).to eq('plain text')
    end
  end

  describe 'code' do
    it 'leaves dollars in inline code untouched' do
      expect(process('`a += $3.99`')).to eq('`a += $3.99`')
    end

    it 'still renders math after inline code' do
      expect(process('`$a$` and $b$')).to eq("`$a$` and #{inline('b')}")
    end

    it 'leaves dollars in double-backtick code untouched' do
      expect(process('``a ` $x$ ``')).to eq('``a ` $x$ ``')
    end

    it 'leaves dollars in fenced code untouched' do
      text = "```ruby\nb = $1 + $2\n```\n$y$"
      expect(process(text)).to eq("```ruby\nb = $1 + $2\n```\n#{inline('y')}")
    end

    it 'leaves fences containing blank lines untouched' do
      text = "```\n$a\n\n$b\n```"
      expect(process(text)).to eq(text)
    end

    it 'leaves indented fences (e.g. in lists) untouched' do
      text = "- x\n  ```\n  $a $b\n  ```"
      expect(process(text)).to eq(text)
    end
  end
end
