---
title: "Going The Way Of the Notification"
date: 2024-03-03T16:26:57+02:00
authors: ["bgtlover", "Tait Hoyem"]
tags:
  - notifications
  - rust
  - hacks
  - zbus
draft: false
---

Ever since the [first release]({{<relref "release_0-1-0">}}), things appeared to be quite stagnant, especially from the outside. This is not an imagination of the public, this is actually true, things were quite stagnant for a while.
One of our maintainers, Tait, has something to say about that:

> I spent probably a few thousand hours trying to figure out:
> - Where is the right place for [this new accessibility protocol](https://github.com/flatpak/xdg-desktop-portal/issues/1046) (DBus spec, Wayland extension)?
> - How would this specification bridge to other protocols (like the existing AT-SPI)?
> - How to implement said protocol (in Mutter/GNOME).
>
> I thought it would be easy, or at least not take very long, so I just went for it.
> Unfortunately, I really bit off more than I could chew with this level of design work.
> I threw in the towel, and returned to Odilia development in February 2024.

We all have a bit more time now, so what better way to communicate this than sharing the fun with everyone and share the latest feature we were working on?

## Introducing Notifications

Notifications are the unsung heroes of a seamless desktop experience across Linux, Windows, MacOS, or even smartphones.
We need to stay informed about events happening around us, and traditionally, this is achieved through small pop-ups, help balloons (as Windows 7 and earlier versions called them), or tooltips that appear on the edge of our screen, alerting us to events, even when the originating application isn't in focus.
However, there's a catch:

Linux doesn't offer an accessibility focused API to get notification events.
Given this, and considering the critical nature of this feature, we're left with no choice but to...

## Diving Into The Hacks

In response to the absence of an accessibility dedicated API for system information in the freedesktop stack, various hacks have emerged over time.
Our approach, while different in practice to Orca, isn't too far off from existing solutions.

In the following, we will describe the hack used by Orca, since this is the only one known to do this, along with the reason we didn't do it this way.
Afterwards, we will document, briefly, our own hack and why we chose this method instead

Warning: This section is quite technical. If you're not technically inclined, feel free to [skip to the limitations section](#limitations).

### Orca's Hack

The approach of Orca is as simple as it is effective:

Most notification daemons, at least back in the day this hack was made, created a new window, with the role of alert whenever a new notification appeared.
Orca monitors the accessibility bus for a window appeared event, it extracts the window title, and then it dereferences the sender to see if it's an accessible application and [checks if the root has the notification role](https://gitlab.gnome.org/GNOME/Orca/-/blob/gnome-46/src/Orca/scripts/apps/notification-daemon/script.py?ref_type=heads).
If all of those are true, the notification text is either in the window title, or in a text element which is typically the first such element in the hierarchy of nodes from that root.

There are a few problems with this design though, and that's why we were not going to use it:

1. This only works if the notification daemon plays by those rules, and by that I mean presenting the notification in exactly that manner. Many do, but smaller, simpler daemons will not have this functionality.
2. Orca relies on the visual presentation being accessible, which is known to be unstable. Or, at least, more unstable than protocols.

You might see where we're going here.

### Odilia's Hack

Odilia's hack relies on the [freedesktop notifications specification](https://specifications.freedesktop.org/notification-spec/notification-spec-latest.html).
This required some up-front design work to design our very own bus sniffer; however, this will be extremely resilient to long-term change.
To accomplish this, we used a common design pattern for DBus interfaces:

1. Monitor the session bus for a message of type method call, using the [zbus::fdo::MonitoringProxy](https://docs.rs/zbus/latest/zbus/fdo/struct.MonitoringProxy.html) type
2. Map over the created stream, to convert the messages to a notification; this `Notification` type contains `title`, `body`, `application_name`, and `severity`.
3. Speak each notification using a given format. For now: "Notification: `<title>` `<body>`".

This approach has its own advantages:

1. We don't rely on presentation. Each notification daemon can present things however it wants on screen, as long as it receives notifications through the standard notification specification.
2. As long as the protocol remains stable, this method will continue to function.

One may say that this method has a disadvantage: oh no! The screen reader will have access to all notifications sent over the bus!
The screen reader will eventually see it anyway; there is no sense hiding it behind a visual window.

## How To Try It

Just clone the repository, then run it:

```shell
git clone https://github.com/odilia-app/odilia
cargo install --path .
odilia
```

For more information, refer to the [installation guide]({{<relref "installation">}})

## Possible Issues

- If your desktop automatically focuses the new notification windows, and/or the desktop uses the announcement role on its notification window, then you may hear the same notification twice.
- We are unsure how to handle this issue right now.

## Conclusion

As always, you are a big reason why we keep developing odilia.
Please let us know how we can make it better in the future!

