source "https://rubygems.org"

gem "jekyll", "~> 4.4"

group :jekyll_plugins do
  gem "jekyll-feed", "~> 0.17"
  gem "jekyll-vite", "~> 3.0"
end

# In-process V8 for the KaTeX/Prism build hooks (_plugins/)
gem "mini_racer", "~> 0.22"

group :test do
  gem "rspec", "~> 3.13"
  # Lets the VS Code Ruby LSP test explorer run RSpec specs
  gem "ruby-lsp-rspec", "~> 0.1", require: false
end
