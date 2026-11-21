import { coverImageFrame, focusAfterDrag } from '@/utils/coverImageFrame';

describe('coverImageFrame', () => {
  const square = { width: 100, height: 100 };
  const portrait = { width: 50, height: 100 };

  it('по центру оставляет середину квадратного фото на высоком экране', () => {
    const frame = coverImageFrame(portrait, square, 0.5, 0.5);

    expect(frame.overflowX).toBe(50);
    expect(frame.overflowY).toBe(0);
    expect(frame.left).toBe(-25);
    expect(frame.top).toBe(0);
  });

  it('крайние точки показывают левый и правый край', () => {
    expect(coverImageFrame(portrait, square, 0, 0.5).left).toBe(0);
    expect(coverImageFrame(portrait, square, 1, 0.5).left).toBe(-50);
  });

  it('на широком кадре сдвигает фото по вертикали', () => {
    const landscape = { width: 200, height: 100 };
    const frame = coverImageFrame(landscape, square, 0.5, 0);

    expect(frame.overflowY).toBe(100);
    expect(frame.top).toBe(0);
    expect(coverImageFrame(landscape, square, 0.5, 1).top).toBe(-100);
  });
});

describe('focusAfterDrag', () => {
  it('сдвиг вправо открывает левую часть фото', () => {
    expect(focusAfterDrag({ x: 0.5, y: 0.5 }, { x: 100, y: 0 }, { x: 400, y: 0 })).toEqual({
      x: 0.25,
      y: 0.5,
    });
  });

  it('не двигает ось, по которой фото и так помещается', () => {
    expect(focusAfterDrag({ x: 0.5, y: 0.2 }, { x: 40, y: 80 }, { x: 0, y: 0 })).toEqual({
      x: 0.5,
      y: 0.2,
    });
  });
});
