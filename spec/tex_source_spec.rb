require_relative '../_plugins/tex_source'

RSpec.describe TexSource do
  macros = {
    '\pdv' => '\frac{\partial #1}{\partial #2}',
    '\ddx' => '\frac{\partial}{\partial#1}',
    '\Ham' => '\mathcal{H}',
    '\explain' => '\mathrel{\hphantom{=}}#1'
  }
  define_method(:copy) { |tex| TexSource.for_copy(tex, macros) }

  describe 'macros' do
    it 'expands arguments in braces' do
      expect(copy('\pdv{\rho}{t}')).to eq('\frac{\partial \rho}{\partial t}')
    end

    it 'expands macros inside arguments' do
      expect(copy('\pdv{\Ham}{p_i}')).to eq('\frac{\partial \mathcal{H}}{\partial p_i}')
    end

    it 'takes single tokens as arguments' do
      expect(copy('\pdv\Ham x')).to eq('\frac{\partial \mathcal{H}}{\partial x}')
    end

    it 'keeps a command apart from a letter argument' do
      expect(copy('\ddx{t}')).to eq('\frac{\partial}{\partial t}')
    end

    it 'leaves other commands and escaped braces alone' do
      expect(copy('\Hamiltonian \{ \pdv{\{a\}}{b}')).to eq('\Hamiltonian \{ \frac{\partial \{a\}}{\partial b}')
    end
  end

  it 'drops the equation number' do
    expect(copy('a = b \tag{\htmlId{eq-energy}{3}}')).to eq('a = b')
    expect(copy('a = b \tag{3}')).to eq('a = b')
  end

  it 'turns references into plain numbers' do
    expect(copy('a \overset{\href{#eq-energy}{(3)}}{=} b')).to eq('a \overset{(3)}{=} b')
  end

  it 'turns explanations into comment lines' do
    tex = <<~'TEX'
      \begin{aligned}
      a &= b \\
        &\explain{\text{Hamilton: } \pdv{\Ham}{p} \\ \text{twice}} \\
        &= c
      \end{aligned}
    TEX
    expect(copy(tex)).to eq(<<~'TEX'.strip)
      \begin{aligned}
      a &= b \\
        % Hamilton: \frac{\partial \mathcal{H}}{\partial p}
        % twice
        &= c
      \end{aligned}
    TEX
  end
end
