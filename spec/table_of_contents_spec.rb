require 'jekyll'
require_relative '../_plugins/table_of_contents'

RSpec.describe TableOfContents do
  it 'lists every h2 as a link to its id' do
    html = <<~HTML
      <h2 id="first">First</h2>
      <p>text</p>
      <h2 id="lagrangian--eulerian">Lagrangian &amp; Eulerian</h2>
    HTML

    expect(TableOfContents.render(html)).to eq(
      '<nav class="toc" aria-label="Table of contents"><ol>' \
      '<li><a href="#first">First</a></li>' \
      '<li><a href="#lagrangian--eulerian">Lagrangian &amp; Eulerian</a></li>' \
      '</ol></nav>'
    )
  end

  it 'ignores other heading levels' do
    html = '<h1 id="a">A</h1><h3 id="b">B</h3><h2 id="c">C</h2>'
    expect(TableOfContents.render(html)).to eq(
      '<nav class="toc" aria-label="Table of contents"><ol><li><a href="#c">C</a></li></ol></nav>'
    )
  end

  it 'keeps inline markup but drops nested links' do
    html = '<h2 id="x">The <em>real</em> <a href="#y">thing</a></h2>'
    expect(TableOfContents.render(html)).to include('<a href="#x">The <em>real</em> thing</a>')
  end

  it 'renders nothing without headings' do
    expect(TableOfContents.render('<p>no headings</p>')).to eq('')
  end
end
