# `jekyll serve` (used by `bin/dev`) is backed by WEBrick, whose
# `DefaultFileHandler#not_modified?` treats a matching `If-Range` header as
# grounds for a bodyless 304 response. That's wrong: `If-Range` only means
# "send the requested byte range (206) if the resource is unchanged, else
# send the whole thing (200)" — it must never produce a 304. Browsers issue
# `Range` + `If-Range` requests once a `<video>` element re-fetches a
# previously seen file (e.g. on page reload), so any video that has already
# been loaded once gets an empty 304 back instead of the video bytes it
# asked for, and playback hangs forever. Smaller videos are less likely to
# have been range-requested yet, which is why only larger ones seem to break.
#
# Fixed upstream in neither webrick nor jekyll as of this writing, so we
# patch the method here. This only matters for the local dev server, so it
# no-ops during `jekyll build` where WEBrick is never loaded.
# 
# Related: https://github.com/ruby/webrick/pull/169
if defined?(WEBrick::HTTPServlet::DefaultFileHandler)
  module WebrickIfRangeFix
    def not_modified?(req, res, mtime, etag)
      return false if req["range"]

      super
    end
  end

  WEBrick::HTTPServlet::DefaultFileHandler.prepend(WebrickIfRangeFix)
end
