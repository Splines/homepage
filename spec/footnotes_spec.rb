require 'jekyll'
require_relative '../_plugins/footnotes'

RSpec.describe Footnotes do
  let(:footnotes) do
    <<~HTML
      <div class="footnotes" role="doc-endnotes">
        <ol>
          <li id="fn:a">
            <p>First, with a <div>nested</div> block. <a href="#fnref:a" class="reversefootnote" role="doc-backlink">&#8617;</a></p>
          </li>
          <li id="fn:b">
            <p>Second <a href="#fnref:b" class="reversefootnote" role="doc-backlink">&#8617;</a></p>
          </li>
        </ol>
      </div>
    HTML
  end

  it 'wraps the footnotes in a closed <details> with a count' do
    html = "<p>Text<sup id=\"fnref:a\"><a href=\"#fn:a\" class=\"footnote\">1</a></sup></p>\n\n#{footnotes}"
    result = Footnotes.collapse(html)

    expect(result).to start_with("<p>Text<sup")
    expect(result).to include(
      '<details class="footnotes-details"><summary>Footnotes ' \
      '<span class="footnotes-count">(2)</span></summary>' \
      "\n<div class=\"footnotes\" role=\"doc-endnotes\">"
    )
    expect(result).not_to include('<details class="footnotes-details" open')
    expect(result).to end_with("</ol>\n</div>\n</details>\n")
  end

  it 'leaves pages without footnotes alone' do
    html = '<p>No footnotes here.</p>'
    expect(Footnotes.collapse(html)).to eq(html)
  end
end
