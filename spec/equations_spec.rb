require 'jekyll'
require_relative '../_plugins/katex'

RSpec.describe Equations do
  def process(text) = Equations.process(text, 'test.md')

  let(:warnings) { [] }

  before do
    allow(Jekyll.logger).to receive(:warn) { |topic, message| warnings << "#{topic} #{message}".strip }
  end

  describe 'numbering' do
    it 'numbers labeled display math and removes the label' do
      expect(process("$$ a $$ <eq:a>\n@eq:a")).to eq(
        "$$ a  \\tag{\\htmlId{eq-a}{1}}$$\n<a class=\"eq-ref\" href=\"#eq-a\">(1)</a>"
      )
    end

    it 'does not number unlabeled equations or advance the counter' do
      out = process("$$ a $$\n$$ b $$ <eq:b>\n@eq:b")
      expect(out).to start_with("$$ a $$\n$$ b  \\tag{\\htmlId{eq-b}{1}}$$")
    end

    it 'resolves forward references' do
      expect(process("@eq:later\n$$ x $$ <eq:later>")).to start_with('<a class="eq-ref" href="#eq-later">(1)</a>')
    end

    it 'keeps punctuation after a reference' do
      expect(process("$$ x $$ <eq:a.b>\nsee @eq:a.b.")).to end_with('(1)</a>.')
    end
  end

  describe 'references in math' do
    it 'turns them into same-page links' do
      out = process("$$ x $$ <eq:a>\n$0 \\overset{@eq:a}{=} y$")
      expect(out).to end_with('$0 \overset{\href{#eq-a}{(1)}}{=} y$')
    end

    it 'renders the link in KaTeX' do
      html = Katex.process(process("$$ x $$ <eq:a>\n$\\overset{@eq:a}{=}$"), {})
      expect(html).to include('id="eq-a"', 'href="#eq-a"')
      expect(html).not_to include('katex-error')
    end
  end

  describe 'code' do
    it 'leaves references and labels in code untouched' do
      text = "`@eq:a` and\n```\n$$ x $$ <eq:a>\n```"
      expect(process(text)).to eq(text)
    end
  end

  describe 'warnings' do
    it 'groups labels that are never referenced' do
      process("$$ a $$ <eq:a>\n$$ b $$ <eq:b>")
      expect(warnings).to eq([
        'Equations: 2 labels never referenced in test.md',
        '(1) <eq:a> a',
        '(2) <eq:b> b'
      ])
    end

    it 'truncates long equations' do
      process("$$\n\\begin{aligned} #{'x + ' * 30} \\\\ &= 0 \\end{aligned}\n$$ <eq:long>")
      expect(warnings.last).to match(/\A\(1\) <eq:long> x \+ x .{20,}…\z/)
    end

    it 'reports unknown references with their count' do
      expect(process('@eq:nope and $@eq:nope$')).to eq(
        '<strong class="eq-ref-missing">(??)</strong> and $\textbf{(??)}$'
      )
      expect(warnings).to eq(['Equations: 1 unknown reference in test.md', '@eq:nope (2×)'])
    end

    it 'reports duplicate labels and only anchors the first one' do
      out = process("$$ a $$ <eq:a>\n$$ b $$ <eq:a>\n@eq:a")
      expect(out).to include('\tag{2}').and include('\htmlId{eq-a}{1}')
      expect(warnings).to eq(['Equations: 1 duplicate label in test.md', '(2) <eq:a> b'])
    end

    it 'reports labels that do not follow display math' do
      expect(process('text <eq:a>')).to eq('text <eq:a>')
      expect(warnings).to eq(['Equations: 1 label not after display math in test.md', '<eq:a>'])
    end

    it 'stays quiet when everything is referenced' do
      process("$$ a $$ <eq:a>\n@eq:a")
      expect(warnings).to be_empty
    end
  end
end
