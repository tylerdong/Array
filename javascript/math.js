//随机打乱数组
function shuffle(arr) {
  let i = arr.length, t, j
  while (i) {
    j = Math.floor(Math.random() * (i--))
    t = arr[i]
    arr[i] = arr[j]
    arr[j] = t
  }
  return arr
}

//生成两个整数中间的随机数
function getRandomIntInclusive(min, max) {
  min = Math.ceil(min)
  max = Math.floor(max)
  return Math.floor(Math.random() * (max - min + 1)) + min //含最大值，含最小值 
}