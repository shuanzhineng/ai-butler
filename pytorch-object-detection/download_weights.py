from utils.downloads import attempt_download

p5 = ['n', 'm', 'l', 'x']  # P5 models
p6 = [f'{x}6' for x in p5]  # P6 models
cls = [f'{x}-cls' for x in p5]  # classification models

for x in p5 + p6 + cls:
    attempt_download(f'weights/yolov5{x}.pt')
print("done.")
