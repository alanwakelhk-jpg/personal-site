把你自己拥有版权（或允许使用）的音频文件放在这个目录，例如：

  song1.mp3
  song2.mp3

然后在 js/config.js 的 playlist 里引用：

  { title: '歌名', artist: '作者', cover: './assets/images/cover.jpg', src: './assets/audio/song1.mp3' }

说明：
- 支持 mp3 / m4a(aac) / ogg / wav，建议 mp3 单曲控制在 5MB 以内，加载更快。
- 也可以直接用音频直链（https://...），但网易云、QQ 音乐的播放地址有防盗链，通常播不出来。
- 目录中没有文件时，播放器会提示"该曲目无法播放"，不会报错崩溃。
