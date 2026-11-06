// 2472048 Jayden Marvel Ethanael
export default class GrafLib {
    constructor(c_width, c_height, image_data) {
        this.canvas_width = c_width;
        this.canvas_height = c_height;
        this.image_data = image_data;
    }

    draw_dot(x, y, color) {
        x = Math.round(x);
        y = Math.round(y);

        if (x < 0 || x >= this.canvas_width || y < 0 || y >= this.canvas_height) return;

        let index = 4 * (x + (y * this.canvas_width));
        this.image_data.data[index] = color.r;
        this.image_data.data[index + 1] = color.g;
        this.image_data.data[index + 2] = color.b;
        this.image_data.data[index + 3] = color.a ?? 255;
    }

    dda_line(x1, x2, y1, y2, color) {
        let dx = Math.abs(x2 - x1);
        let dy = Math.abs(y2 - y1);
        x1 = Math.round(x1);
        x2 = Math.round(x2);
        y1 = Math.round(y1);
        y2 = Math.round(y2);

        if (dx === 0 && dy === 0) {
            this.draw_dot(x1, y1, color);
            return;
        }

        if (dx >= dy) {
            let m = (y2 - y1) / dx;
            let y = y1;
            if (x2 > x1) {
                for (let x = x1; x <= x2; x++) {
                    this.draw_dot(x, Math.round(y), color);
                    y = y + m;
                }
            } else {
                for (let x = x1; x >= x2; x--) {
                    this.draw_dot(x, Math.round(y), color);
                    y = y + m;
                }
            }
        } else {
            let m = (x2 - x1) / dy;
            let x = x1;
            if (y2 > y1) {
                for (let y = y1; y <= y2; y++) {
                    this.draw_dot(Math.round(x), y, color);
                    x = x + m;
                }
            } else {
                for (let y = y1; y >= y2; y--) {
                    this.draw_dot(Math.round(x), y, color);
                    x = x + m;
                }
            }
        }
    }

    // Jesko's method
    // https://en.wikipedia.org/wiki/Midpoint_circle_algorithm
    circle(xc, yc, radius, color) {
        xc = Math.round(xc);
        yc = Math.round(yc);
        radius = Math.round(radius);

        if (radius < 0) return;

        let x = radius;
        let y = 0;
        let t1 = radius / 16;

        while (x >= y) {
            this.draw_dot(xc + x, yc + y, color);
            this.draw_dot(xc - x, yc + y, color);
            this.draw_dot(xc + x, yc - y, color);
            this.draw_dot(xc - x, yc - y, color);
            this.draw_dot(xc + y, yc + x, color);
            this.draw_dot(xc - y, yc + x, color);
            this.draw_dot(xc + y, yc - x, color);
            this.draw_dot(xc - y, yc - x, color);

            y++;
            t1 += y;
            let t2 = t1 - x;
            if (t2 >= 0) {
                t1 = t2;
                x--;
            }
        }
    }

    elipse(xc, yc, x, y, color) {
        for (let thetha = 0 * Math.PI; thetha < Math.PI * 2; thetha += 1 / Math.max(x, y)) {
            let x_pos = xc - x * Math.cos(thetha);
            let y_pos = yc + y * Math.sin(thetha);
            this.draw_dot(Math.round(x_pos), Math.round(y_pos), color);
        }
    }

    polygon(points, color) {
        for (let i = 0; i < points.length - 1; i++) {
            this.dda_line(points[i].x, points[i + 1].x, points[i].y, points[i + 1].y, color);
        }
        this.dda_line(points[points.length - 1].x, points[0].x, points[points.length - 1].y, points[0].y, color);
    }

    get_dot(x, y) {
        let index = 4 * (x + (y * this.canvas_width));
        return {
            r: this.image_data.data[index],
            g: this.image_data.data[index + 1],
            b: this.image_data.data[index + 2],
            a: this.image_data.data[index + 3]
        };
    }

    is_color_same(color1, color2) {
        if (!color1 || !color2) return 0;
        let a1 = color1.a ?? 255;
        let a2 = color2.a ?? 255;
        if (color1.r === color2.r && color1.g === color2.g && color1.b === color2.b && a1 === a2) {
            return 1;
        }
        return 0;
    }

    flood_fill(x, y, replace_color, fill_color) {
        x = Math.round(x);
        y = Math.round(y);

        if (x < 0 || x >= this.canvas_width || y < 0 || y >= this.canvas_height) return;
        if (this.is_color_same(replace_color, fill_color) === 1) return;
        if (this.is_color_same(this.get_dot(x, y), replace_color) === 0) return;

        this.draw_dot(x, y, fill_color);
        let stack = [{ x: x, y: y }];

        while (stack.length > 0) {
            let point = stack.pop();
            let cx = point.x;
            let cy = point.y;

            if (cx < this.canvas_width - 1 && this.is_color_same(this.get_dot(cx + 1, cy), replace_color) === 1) {
                this.draw_dot(cx + 1, cy, fill_color);
                stack.push({ x: cx + 1, y: cy });
            }
            if (cx > 0 && this.is_color_same(this.get_dot(cx - 1, cy), replace_color) === 1) {
                this.draw_dot(cx - 1, cy, fill_color);
                stack.push({ x: cx - 1, y: cy });
            }
            if (cy < this.canvas_height - 1 && this.is_color_same(this.get_dot(cx, cy + 1), replace_color) === 1) {
                this.draw_dot(cx, cy + 1, fill_color);
                stack.push({ x: cx, y: cy + 1 });
            }
            if (cy > 0 && this.is_color_same(this.get_dot(cx, cy - 1), replace_color) === 1) {
                this.draw_dot(cx, cy - 1, fill_color);
                stack.push({ x: cx, y: cy - 1 });
            }
        }
    }

    translate(point, translation) {
        return {
            x: point.x + translation.x,
            y: point.y + translation.y
        };
    }

    translate_multiple(points, translation) {
        let new_points = [];
        for (let i = 0; i < points.length; i++) {
            new_points.push(this.translate(points[i], translation));
        }
        return new_points;
    }

    scale(point, scale_factor) {
        return {
            x: point.x * scale_factor.x,
            y: point.y * scale_factor.y
        };
    }

    scale_fixed_point(point, scale_factor, anchor) {
        return {
            x: anchor.x + ((point.x - anchor.x) * scale_factor.x),
            y: anchor.y + ((point.y - anchor.y) * scale_factor.y)
        };
    }

    scale_multiple(points, scale_factor) {
        let new_points = [];
        for (let i = 0; i < points.length; i++) {
            new_points.push(this.scale(points[i], scale_factor));
        }
        return new_points;
    }

    scale_fixed_point_multiple(points, scale_factor, anchor) {
        let new_points = [];
        for (let i = 0; i < points.length; i++) {
            new_points.push(this.scale_fixed_point(points[i], scale_factor, anchor));
        }
        return new_points;
    }

    rotate(point, angle) {
        return {
            x: point.x * Math.cos(angle) - point.y * Math.sin(angle),
            y: point.y * Math.cos(angle) + point.x * Math.sin(angle)
        };
    }

    rotate_fixed_point(point, angle, anchor) {
        let zero_x = point.x - anchor.x;
        let zero_y = point.y - anchor.y;
        return {
            x: anchor.x + (zero_x * Math.cos(angle) - zero_y * Math.sin(angle)),
            y: anchor.y + (zero_y * Math.cos(angle) + zero_x * Math.sin(angle))
        };
    }

    rotate_multiple(points, angle) {
        let new_points = [];
        for (let i = 0; i < points.length; i++) {
            new_points.push(this.rotate(points[i], angle));
        }
        return new_points;
    }

    rotate_fixed_point_multiple(points, angle, anchor) {
        let new_points = [];
        for (let i = 0; i < points.length; i++) {
            new_points.push(this.rotate_fixed_point(points[i], angle, anchor));
        }
        return new_points;
    }

    clearScreen(context) {
        context.clearRect(0, 0, this.canvas_width, this.canvas_height);
        this.image_data = context.getImageData(0, 0, this.canvas_width, this.canvas_height);
    }

    fill_polygon(points, replace_color, fill_color) {
        let sum_x = 0;
        let sum_y = 0;
        let n = points.length;
        for (let i = 0; i < n; i++) {
            sum_x += points[i].x;
            sum_y += points[i].y;
        }

        let x = Math.round(sum_x / n);
        let y = Math.round(sum_y / n);

        if (!fill_color) {
            fill_color = replace_color;
            replace_color = this.get_dot(x, y);
        }

        this.polygon(points, fill_color);
        this.flood_fill(x, y, replace_color, fill_color);
    }
}
