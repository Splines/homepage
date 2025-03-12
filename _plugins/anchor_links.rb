# Adds anchor links to <h2> headers in Jekyll
#
# Inspired by:
# https://euandre.org/til/2020/08/13/anchor-headers-and-code-lines-in-jekyll.html
Jekyll::Hooks.register :documents, :post_render do |doc|
  if doc.output_ext != ".html"
    return
  end

  doc.output = doc.output.gsub(
    /<h2(.*?)id="([\w-]+)"(.*?)>(.*?)<\/h2>/,
    '<h2\1id="\2"\3><a href="#\2"></a>\4</h2>'
  )
end