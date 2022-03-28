---
layout: page
title: Blogs
permalink: /blogs/
---

{% for post in site.posts %}
  <font size="3" color='gray'>{{ post.date | date: '%b %d, %Y' }}</font>
  [<font size="5">{{post.title}}</font>]({{post.url}})
  <br>
  <br>
{% endfor %}
