/**
 * @fileOverview This file will generate a PDF representation of dots and movements
 */

var SHOW, DOT, PDF, SHEETS;
// In millimeters
const WIDTH = 215.9;
const HEIGHT = 279.4;
const DOT_DATA = {
    "open": "data:image/jpeg;base64,/9j/4AAQSkZJRgABAQEASABIAAD/4QBARXhpZgAATU0AKgAAAAgAAYdpAAQAAAABAAAAGgAAAAAAAqACAAQAAAABAAAAEKADAAQAAAABAAAAEAAAAAD/2wBDAAEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQH/wAALCAAQABABAREA/8QAHwAAAQUBAQEBAQEAAAAAAAAAAAECAwQFBgcICQoL/8QAtRAAAgEDAwIEAwUFBAQAAAF9AQIDAAQRBRIhMUEGE1FhByJxFDKBkaEII0KxwRVS0fAkM2JyggkKFhcYGRolJicoKSo0NTY3ODk6Q0RFRkdISUpTVFVWV1hZWmNkZWZnaGlqc3R1dnd4eXqDhIWGh4iJipKTlJWWl5iZmqKjpKWmp6ipqrKztLW2t7i5usLDxMXGx8jJytLT1NXW19jZ2uHi4+Tl5ufo6erx8vP09fb3+Pn6/9oACAEBAAA/AP6+fGHxi/an+Mvx2+MXwQ/ZKuvgB8NvCX7O3/CvtB+LP7Rnx08H/EX44+f8dvGPg62+J+pfs1+F/wBmvwb8Qf2adTb/AIRv4JfEP4DfGbW/2jJ/2hb/AMHQf8LO0j4S+Gvhh428W2vxL174N9B8FPjX8fdC+Puofsp/tWWHwf1LxvqXwfuvjX8Dvjj8FLXxp4P8K/tDeFfB3jTSvCfx9sNQ+AXizVfijq/7O3iD9nbV/ij+zvoN1a69+0P8XtO+N2nfF7SvH/gDVdEudE+J/wAMPhR5/q+kftD/ALKv7Q/7R3xP+GH7OPiD9qf4E/tT+IPhr8W/EXh74S/Er4S6B+0r4A/aV8P/AAl8Ifs+eK5I/Cn7Qfi/9n34Han+zBqfwO/Z9+BN1pupWvx2vfjf4Z+N9748VvAfjr4beOtP1D4IdB8HfB/x2+Mv7U9t+1r8b/g7/wAM7eEvht8APGHwM/Zz+E+vfEHwd4x+O0//AAvH4i/D7xl+0p4p/aU034YXXxD+CXhvOp/s0/s9Qfs56J8Gfjz8TvI8HX/xP8S/FvV7Xxb420H4afBv/9k=",
    "solid": "data:image/jpeg;base64,/9j/4AAQSkZJRgABAQEASABIAAD/4QBARXhpZgAATU0AKgAAAAgAAYdpAAQAAAABAAAAGgAAAAAAAqACAAQAAAABAAAAEKADAAQAAAABAAAAEAAAAAD/2wBDAAEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQH/wAALCAAQABABAREA/8QAHwAAAQUBAQEBAQEAAAAAAAAAAAECAwQFBgcICQoL/8QAtRAAAgEDAwIEAwUFBAQAAAF9AQIDAAQRBRIhMUEGE1FhByJxFDKBkaEII0KxwRVS0fAkM2JyggkKFhcYGRolJicoKSo0NTY3ODk6Q0RFRkdISUpTVFVWV1hZWmNkZWZnaGlqc3R1dnd4eXqDhIWGh4iJipKTlJWWl5iZmqKjpKWmp6ipqrKztLW2t7i5usLDxMXGx8jJytLT1NXW19jZ2uHi4+Tl5ufo6erx8vP09fb3+Pn6/9oACAEBAAA/APtv/gvJ/wAHPPxC/wCCbX7UF3+xh+yL8HPg/wDEr4reAvD/AMOvFfxm+I3xrk+JmqeFfCGo+OdA1/xQnwhsPhr4Yb4V3OreIH8E6z8HviTa/FTRvjB4h8K22neLNV8B3ngx/FOn6jf+HvqD/g3x/wCDg7WP+Cu2sfFT4CfHv4WfD/4S/tNfCT4f2PxStrn4W33jufwJ8YfAlx471Tw14s13QvCfibTPEf8Awqz/AIVZ/wAJF8GPDmp6Z4j+M/jjWPiJrHjjUPE/hjT9E0XRNZ0bQ/yg/wCDjX/g3K/ba/a+/ba8UftzfsM+F/D/AMbLb42eH/hNo3xX+FOs/FnwP4H+IXhz4heB/A9/8O7jxZ4Tt/iJYfDj4dxfB+L4d/Dj4T2dzbXnxY8S/Ey5+JniXxNe2Xhr/hCRHJ4b+v8A/g2G/wCCDn7UH/BNr4hfGP8Aa6/bPtPD/gL4rfEv4Px/BT4c/Bnwp8RtA8c6j4Q8K6p8TB4n+JWofF5/DGgaz4JfxBq1z8K/g9rXwruvht8YfFmnW3hXxD4zs/Hmlaf4paw07w9//9k=",
    "open-x": "data:image/jpeg;base64,/9j/4AAQSkZJRgABAQEASABIAAD/4QBARXhpZgAATU0AKgAAAAgAAYdpAAQAAAABAAAAGgAAAAAAAqACAAQAAAABAAAAEKADAAQAAAABAAAAEAAAAAD/2wBDAAEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQH/wAALCAAQABABAREA/8QAHwAAAQUBAQEBAQEAAAAAAAAAAAECAwQFBgcICQoL/8QAtRAAAgEDAwIEAwUFBAQAAAF9AQIDAAQRBRIhMUEGE1FhByJxFDKBkaEII0KxwRVS0fAkM2JyggkKFhcYGRolJicoKSo0NTY3ODk6Q0RFRkdISUpTVFVWV1hZWmNkZWZnaGlqc3R1dnd4eXqDhIWGh4iJipKTlJWWl5iZmqKjpKWmp6ipqrKztLW2t7i5usLDxMXGx8jJytLT1NXW19jZ2uHi4+Tl5ufo6erx8vP09fb3+Pn6/9oACAEBAAA/AP6WvHP7Vf7XGj/tQfEn9mr4c+P/AIP6J8IfDvxg0PwVJ+3T+0J8F9b+JnhX4Z/tD/GfQPBPxO+Hf/BN3xv8FfhT8Xf2Xrm48Qah4J+M3w18UfAv9ta/8deGPhLr+neNPgv+xB4o8P8Axd/be8S3HxI+IvQfsl/taftHfHb9o7wz8Lfil4m+H+nfC3Tvh/8AEP40/AP4+fBb4eXXhbwJ/wAFQ/AnhW68HfD/AOIfjjwP8PPiD4x+N/i39mr4Afs1eLfjf8M7PStWvPiZ4q1j9vDWPFXwc/ab/Zk+Menfspad8Qvh98VPH/iZ8M/2h9V/aH/ab8Q+Hv2ZPjB8ev8Agnv8evjBZ+Jvjn8DPDV58Jfhl+0r+0D+0r8MvhL8Lf2adbtrnRP2lvil+z78O9T/AOCUGp/Dv9n3wdo/izwnrHjHw/8AG/8AaZ+N/h/WZYtG+M//AATK+M95Z/FD0D9lTwN+0/o/7XHgD4jftK/Db4weHfhDonwf+NP7Pf7CsfjXXNA+M/7Q/wAM/CvxM1v4RfFf41+CP+CkXxE+GPjb4zeCdQ8QXNz+y94FsP2KPjp4X+JXjTTtf+EvhjxB4Y/bf+NHiX9t74u/De3+Iv8A/9k=",
    "solid-x": "data:image/jpeg;base64,/9j/4AAQSkZJRgABAQEASABIAAD/4QBARXhpZgAATU0AKgAAAAgAAYdpAAQAAAABAAAAGgAAAAAAAqACAAQAAAABAAAAEKADAAQAAAABAAAAEAAAAAD/2wBDAAEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQH/wAALCAAQABABAREA/8QAHwAAAQUBAQEBAQEAAAAAAAAAAAECAwQFBgcICQoL/8QAtRAAAgEDAwIEAwUFBAQAAAF9AQIDAAQRBRIhMUEGE1FhByJxFDKBkaEII0KxwRVS0fAkM2JyggkKFhcYGRolJicoKSo0NTY3ODk6Q0RFRkdISUpTVFVWV1hZWmNkZWZnaGlqc3R1dnd4eXqDhIWGh4iJipKTlJWWl5iZmqKjpKWmp6ipqrKztLW2t7i5usLDxMXGx8jJytLT1NXW19jZ2uHi4+Tl5ufo6erx8vP09fb3+Pn6/9oACAEBAAA/APpv/gtL/wAHK/x9/wCCW37UHxA/Yo/Z60L4P/tJfEnwr4g8O/EzxR8Ufjv4V8aaXB8IfCvxa0DU/Hth+y5qngX4a3Hwi0n4meIPBmk+IvAXjDwB+0F4Z8aabp0Hwb8T+Fvg98S/A3xD+O3gr4jfHrxh9Qf8EE/+C9nxT/4LGfFO++Dvxisfh/8As9/Fr9nv4f8AiD4xeMPB/wAHfD/iPWfDv7WXh3WfEd78Pra6trr4hWXjT/hQXw/+AX/CafD668YeD7b4g+J/in8c/in4n+H3jDwf8Qfh38Jfh18Yvg78Tfyg/wCC+/8AwQI/ba/b+/ba+Lv7dv7CXwi8QeP9D8f+IPBXwo+Ifw8+LHjXwP8ABr4ha58Qvg14Hf4V+JPjD8HvDfxVT4caTF+zBFpPw48E+BdE1vx142t/iZ8SfiZb+Mvil8LfBvi39lzxb8Kfitrn1/8A8G1H/BFr9qD/AIJbfH3Xv2hf22Ph/wCIPCvxJ/aS+D/ir4EfC/wx8M/EWgfFrwr8IYNL8aW/xK8d6X+1Jf8AgLTPEWk+DPEHxM0n4ReC/E37Pvj/AMH+PvE/wbg07TfHXw0+MXinwV8dviH8Bfhz4w//2Q==",
    "open-forwardslash": "data:image/jpeg;base64,/9j/4AAQSkZJRgABAQEASABIAAD/4QBARXhpZgAATU0AKgAAAAgAAYdpAAQAAAABAAAAGgAAAAAAAqACAAQAAAABAAAAEKADAAQAAAABAAAAEAAAAAD/2wBDAAEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQH/wAALCAAQABABAREA/8QAHwAAAQUBAQEBAQEAAAAAAAAAAAECAwQFBgcICQoL/8QAtRAAAgEDAwIEAwUFBAQAAAF9AQIDAAQRBRIhMUEGE1FhByJxFDKBkaEII0KxwRVS0fAkM2JyggkKFhcYGRolJicoKSo0NTY3ODk6Q0RFRkdISUpTVFVWV1hZWmNkZWZnaGlqc3R1dnd4eXqDhIWGh4iJipKTlJWWl5iZmqKjpKWmp6ipqrKztLW2t7i5usLDxMXGx8jJytLT1NXW19jZ2uHi4+Tl5ufo6erx8vP09fb3+Pn6/9oACAEBAAA/AP6+fGHxi/an+Mvx2+MXwQ/ZKuvgB8NvCX7O3/CvtB+LP7Rnx08H/EX44+f8dvGPg62+J+pfs1+F/wBmvwb8Qf2adTb/AIRv4JfEP4DfGbW/2jJ/2hb/AMHQf8LO0j4S+Gvhh428W2vxL174N+Afsl/taftHfHb9o7wz8Lfil4m+H+nfC3Tvh/8AEP40/AP4+fBb4eXXhbwJ/wAFQ/AnhW68HfD/AOIfjjwP8PPiD4x+N/i39mr4Afs1eLfjf8M7PStWvPiZ4q1j9vDWPFXwc/ab/Zk+Menfspad8Qvh98VPH/iZ8M/2h9V/aH/ab8Q+Hv2ZPjB8ev8Agnv8evjBZ+Jvjn8DPDV58Jfhl+0r+0D+0r8MvhL8Lf2adbtrnRP2lvil+z78O9T/AOCUGp/Dv9n3wdo/izwnrHjHw/8AG/8AaZ+N/h/WZYtG+M//AATK+M95Z/FD7f8Ag74P+O3xl/antv2tfjf8Hf8Ahnbwl8NvgB4w+Bn7Ofwn174g+DvGPx2n/wCF4/EX4feMv2lPFP7Smm/DC6+IfwS8N51P9mn9nqD9nPRPgz8efid5Hg6/+J/iX4t6va+LfG2g/DT4N//Z",
    "solid-forwardslash": "data:image/jpeg;base64,/9j/4AAQSkZJRgABAQEASABIAAD/4QBARXhpZgAATU0AKgAAAAgAAYdpAAQAAAABAAAAGgAAAAAAAqACAAQAAAABAAAAEKADAAQAAAABAAAAEAAAAAD/2wBDAAEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQH/wAALCAAQABABAREA/8QAHwAAAQUBAQEBAQEAAAAAAAAAAAECAwQFBgcICQoL/8QAtRAAAgEDAwIEAwUFBAQAAAF9AQIDAAQRBRIhMUEGE1FhByJxFDKBkaEII0KxwRVS0fAkM2JyggkKFhcYGRolJicoKSo0NTY3ODk6Q0RFRkdISUpTVFVWV1hZWmNkZWZnaGlqc3R1dnd4eXqDhIWGh4iJipKTlJWWl5iZmqKjpKWmp6ipqrKztLW2t7i5usLDxMXGx8jJytLT1NXW19jZ2uHi4+Tl5ufo6erx8vP09fb3+Pn6/9oACAEBAAA/APtv/gvJ/wAHPPxC/wCCbX7UF3+xh+yL8HPg/wDEr4reAvD/AMOvFfxm+I3xrk+JmqeFfCGo+OdA1/xQnwhsPhr4Yb4V3OreIH8E6z8HviTa/FTRvjB4h8K22neLNV8B3ngx/FOn6jf+HvYP+CCf/Bez4p/8FjPinffB34xWPw//AGe/i1+z38P/ABB8YvGHg/4O+H/Ees+Hf2svDus+I734fW11bXXxCsvGn/Cgvh/8Av8AhNPh9deMPB9t8QfE/wAU/jn8U/E/w+8YeD/iD8O/hL8OvjF8Hfib+UH/AAX3/wCCBH7bX7f37bXxd/bt/YS+EXiDx/ofj/xB4K+FHxD+HnxY8a+B/g18Qtc+IXwa8Dv8K/Enxh+D3hv4qp8ONJi/Zgi0n4ceCfAuia3468bW/wATPiT8TLfxl8Uvhb4N8W/sueLfhT8Vtc+//wDg2G/4IOftQf8ABNr4hfGP9rr9s+08P+Avit8S/g/H8FPhz8GfCnxG0DxzqPhDwrqnxMHif4lah8Xn8MaBrPgl/EGrXPwr+D2tfCu6+G3xh8WadbeFfEPjOz8eaVp/ilrDTvD3/9k=",
    "open-backslash": "data:image/jpeg;base64,/9j/4AAQSkZJRgABAQEASABIAAD/4QBARXhpZgAATU0AKgAAAAgAAYdpAAQAAAABAAAAGgAAAAAAAqACAAQAAAABAAAAEKADAAQAAAABAAAAEAAAAAD/2wBDAAEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQH/wAALCAAQABABAREA/8QAHwAAAQUBAQEBAQEAAAAAAAAAAAECAwQFBgcICQoL/8QAtRAAAgEDAwIEAwUFBAQAAAF9AQIDAAQRBRIhMUEGE1FhByJxFDKBkaEII0KxwRVS0fAkM2JyggkKFhcYGRolJicoKSo0NTY3ODk6Q0RFRkdISUpTVFVWV1hZWmNkZWZnaGlqc3R1dnd4eXqDhIWGh4iJipKTlJWWl5iZmqKjpKWmp6ipqrKztLW2t7i5usLDxMXGx8jJytLT1NXW19jZ2uHi4+Tl5ufo6erx8vP09fb3+Pn6/9oACAEBAAA/AP6WvHP7Vf7XGj/tQfEn9mr4c+P/AIP6J8IfDvxg0PwVJ+3T+0J8F9b+JnhX4Z/tD/GfQPBPxO+Hf/BN3xv8FfhT8Xf2Xrm48Qah4J+M3w18UfAv9ta/8deGPhLr+neNPgv+xB4o8P8Axd/be8S3HxI+Iv1/8FPjX8fdC+Puofsp/tWWHwf1LxvqXwfuvjX8Dvjj8FLXxp4P8K/tDeFfB3jTSvCfx9sNQ+AXizVfijq/7O3iD9nbV/ij+zvoN1a69+0P8XtO+N2nfF7SvH/gDVdEudE+J/ww+FHj/wAQ/h58Xfgl8Xf2tNV0r9kv/htv9lL9tv8A4Q7xd8Uvhb4R8Y/BN/jZpvxsf4J+Gf2ZfiZ4d8RfDP8Aab8TfAn9njxj+yB4x/Z4+BPwUtZ4Lr416v8AF3TPi7q/xFsNQ+HXxB+FvxBs7z4JeQfsqeBv2n9H/a48AfEb9pX4bfGDw78IdE+D/wAaf2e/2FY/GuuaB8Z/2h/hn4V+Jmt/CL4r/GvwR/wUi+Inwx8bfGbwTqHiC5uf2XvAth+xR8dPC/xK8aadr/wl8MeIPDH7b/xo8S/tvfF34b2/xF//2Q==",
    "solid-backslash": "data:image/jpeg;base64,/9j/4AAQSkZJRgABAQEASABIAAD/4QBARXhpZgAATU0AKgAAAAgAAYdpAAQAAAABAAAAGgAAAAAAAqACAAQAAAABAAAAEKADAAQAAAABAAAAEAAAAAD/2wBDAAEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQH/wAALCAAQABABAREA/8QAHwAAAQUBAQEBAQEAAAAAAAAAAAECAwQFBgcICQoL/8QAtRAAAgEDAwIEAwUFBAQAAAF9AQIDAAQRBRIhMUEGE1FhByJxFDKBkaEII0KxwRVS0fAkM2JyggkKFhcYGRolJicoKSo0NTY3ODk6Q0RFRkdISUpTVFVWV1hZWmNkZWZnaGlqc3R1dnd4eXqDhIWGh4iJipKTlJWWl5iZmqKjpKWmp6ipqrKztLW2t7i5usLDxMXGx8jJytLT1NXW19jZ2uHi4+Tl5ufo6erx8vP09fb3+Pn6/9oACAEBAAA/APpv/gtL/wAHK/x9/wCCW37UHxA/Yo/Z60L4P/tJfEnwr4g8O/EzxR8Ufjv4V8aaXB8IfCvxa0DU/Hth+y5qngX4a3Hwi0n4meIPBmk+IvAXjDwB+0F4Z8aabp0Hwb8T+Fvg98S/A3xD+O3gr4jfHrxh9wf8G+P/AAcHax/wV21j4qfAT49/Cz4f/CX9pr4SfD+x+KVtc/C2+8dz+BPjD4EuPHeqeGvFmu6F4T8TaZ4j/wCFWf8ACrP+Ei+DHhzU9M8R/GfxxrHxE1jxxqHifwxp+iaLoms6Nof5Qf8ABxr/AMG5X7bX7X37bXij9ub9hnwv4f8AjZbfGzw/8JtG+K/wp1n4s+B/A/xC8OfELwP4Hv8A4d3Hizwnb/ESw+HHw7i+D8Xw7+HHwns7m2vPix4l+Jlz8TPEvia9svDX/CEiOTw37/8A8G1H/BFr9qD/AIJbfH3Xv2hf22Ph/wCIPCvxJ/aS+D/ir4EfC/wx8M/EWgfFrwr8IYNL8aW/xK8d6X+1Jf8AgLTPEWk+DPEHxM0n4ReC/E37Pvj/AMH+PvE/wbg07TfHXw0+MXinwV8dviH8Bfhz4w//2Q=="
};

/**
 * generate will generate a PDF for a specific dot, containing its movements,
 * positions, and continuities relevant to it.
 *
 * @param {Show} show
 * @param {String} dot
 *
 * The function will end with a save call, which will prompt a new window and/or
 * a dialog box to download the generated PDF.
 */
var generate = function(show, dot) {
    PDF = jsPDF("portrait", "mm", "letter");
    SHOW = show;
    DOT = dot;
    SHEETS = show.getSheets();
    for (var page = 1; page <= Math.ceil(SHOW.getNumSheets() / 4); page++) {
        if (page != 1) {
            PDF.addPage();
        }
        _headers(page);
        _dotContinuity(page);
        _individualContinuity();
        _movementDiagram();
        _birdseye();
        _surroundingDots();
    }
    PDF.save("show.pdf");
};

/**
 * Returns the width of a String, in whatever units jsPDF is currently using
 * @param {String} text
 * @param {int} size, font size the text will be in
 */
function _getTextWidth(text, size) {
    return PDF.getStringUnitWidth(text) * size/PDF.internal.scaleFactor
}

/**
 * Returns the height of text in the current fontsize, in whatever units jsPDF is
 * currently using
 * @param {int} size, font size the text will be in
 */
function _getTextHeight(size) {
    return size/PDF.internal.scaleFactor;
}

/**
 * Draws the headers on the PDF. Includes:
 *      - Stuntsheet number
 *      - Dot number
 *      - "California Marching Band: <show title>"
 *      - Page number
 *
 * @param {int} page is the current page number
 * @param {String} dot is the selected dot label
 */
var _headers = function(page) {
    // function objects
    var totalPages = Math.ceil(SHEETS.length/4);

    var box = {
        height: _getTextHeight(16) * 3,
        width: WIDTH * 2/3,
        offsetX: WIDTH * 1/6,
        offsetY: 5,
        paddingX: 3,
        paddingY: 1,
        draw: function(x, y) {
            PDF.rect(x, y, this.width, this.height);
        }
    };

    var title = {
        label: "California Marching Band:",
        text: SHOW.getTitle(),
        size: 16,
        draw: function(y) {
            PDF.setFontSize(this.size);
            PDF.text(
                this.label,
                WIDTH/2 - _getTextWidth(this.label, this.size)/2,
                y
            );
            PDF.text(
                this.text,
                WIDTH/2 - _getTextWidth(this.text, this.size)/2,
                y + this.height + 1
            );
        },

        init: function() {
            this.height = _getTextHeight(this.size);
            return this;
        }
    }.init();

    var pageInfo = {
        text: page + "/" + totalPages,
        size: 12,
        draw: function(x, y) {
            var text = this.text.split("/");
            PDF.setFontSize(this.size);
            PDF.text(text[0], x, y - 1);
            PDF.text("/", x + _getTextWidth(text[0], this.size) - .3, y);
            PDF.text(text[1], x + _getTextWidth(text[0], this.size) + .7, y + 1);
        },

        init: function() {
            this.width = _getTextWidth(this.text, this.size);
            this.height = _getTextHeight(this.size);
            this.offsetCenter = box.height/2 + this.height/2;
            return this;
        }
    }.init();

    var sheetInfo = {
        marginX: 4,
        marginY: 3,
        size: 14,
        sheet: (page - 1) * 4 + 1,
        draw: function(x, y) {
            PDF.text("SS " + this.sheet + "/" + SHEETS.length, x, y);
            PDF.text("Dot " + DOT, x, y + _getTextHeight(this.size));
        },

        init: function() {
            // Wider width will probably be the stuntsheet counter
            this.width = _getTextWidth("SS 00/00", this.size);
            this.height = _getTextHeight(this.size);
            return this;
        }
    }.init();
    
    var baselines = {
        top: box.offsetY,
        bottom: HEIGHT - (box.offsetY + box.height),
        left: box.offsetX + box.paddingX,
        right: box.offsetX + box.width - box.paddingX - pageInfo.width
    }

    /* Rectangles */
    box.draw(box.offsetX, box.offsetY);
    box.draw(box.offsetX, HEIGHT - (box.offsetY + box.height));

    /* Show titles */
    title.draw(baselines.top + box.paddingY + title.height);
    title.draw(baselines.bottom + box.paddingY + title.height);

    /* Page # Information */
    pageInfo.draw(baselines.left, baselines.top + pageInfo.offsetCenter);
    pageInfo.draw(baselines.right, baselines.top + pageInfo.offsetCenter);
    pageInfo.draw(baselines.left, baselines.bottom + pageInfo.offsetCenter);
    pageInfo.draw(baselines.right, baselines.bottom + pageInfo.offsetCenter);

    /* Stuntsheet and Dot Info */
    // top left
    sheetInfo.draw(
        sheetInfo.marginX,
        sheetInfo.marginY + sheetInfo.height
    );
    // bottom left
    if (++sheetInfo.sheet <= SHEETS.length) {
        sheetInfo.draw(
            sheetInfo.marginX,
            sheetInfo.marginY + sheetInfo.height + HEIGHT/2
        );
    }
    // top right
    if (++sheetInfo.sheet <= SHEETS.length) {
        sheetInfo.draw(
            WIDTH - sheetInfo.width,
            sheetInfo.marginY + sheetInfo.height
        );
    }
    // bottom right
    if (++sheetInfo.sheet <= SHEETS.length) {
        sheetInfo.draw(
            WIDTH - sheetInfo.width,
            sheetInfo.marginY + sheetInfo.height + HEIGHT/2
        );
    }
}

/**
 * Writes the continuites for the given dot type on the PDF. Includes:
 *      - Dot circle type
 *      - Overall Continuity
 *      - Measure/beat number
 */
var _dotContinuity = function(page) {
    var box = {
        height: _getTextHeight(12) * 4,
        offsetTop: _getTextHeight(16) * 3 + 5,
        offsetBottom: HEIGHT/2 + _getTextHeight(14) * 2 + 3,
        paddingX: 2,
        paddingY: 1,
        marginX: 3,
        marginY: 2,
        draw: function(x, y) {
            PDF.rect(x, y, this.width, this.height);
        },

        init: function() {
            this.width = WIDTH/2 - this.marginX*2;
            return this;
        }
    }.init();
    var text = {
        size: 10,
        // need the (x,y) coordinates of the top left corner of box
        draw: function(sheet, x, y) {
            var size = this.size;
            var dotType = sheet.getDotType(DOT);
            var dotImage = DOT_DATA[dotType];
            var continuities = sheet.getContinuityTexts(dotType);

            PDF.addImage(
                dotImage,
                "JPEG",
                x + box.paddingX,
                y + box.paddingY
            );
            PDF.setFontSize(this.size);
            PDF.text(
                ":",
                x + box.paddingX + 4,
                y + box.paddingY + 3
            );
            PDF.text(
                continuities,
                x + box.paddingX + 6,
                y + box.paddingY + 3.5
            );
        }
    };
    var sheets = []; // contains the sheets on this page, up to 4

    for (var i = 0; i < 4; i++) {
        var sheet = (page - 1) * 4 + i;
        if (sheet == SHEETS.length) {
            break;
        }
        sheets.push(SHEETS[sheet]);
    }

    // top left
    box.draw(box.marginX, box.offsetTop + box.marginY);
    text.draw(sheets[0], box.marginX, box.offsetTop + box.marginY);

    // bottom left
    if (sheets.length > 1) {
        box.draw(box.marginX, box.offsetBottom + box.marginY);
        text.draw(sheets[1], box.marginX, box.offsetBottom + box.marginY);
    }

    // top right
    if (sheets.length > 2) {
        box.draw(box.marginX + WIDTH/2, box.offsetTop + box.marginY);
        text.draw(sheets[2], box.marginX + WIDTH/2, box.offsetTop + box.marginY);
    }

    // bottom right
    if (sheets.length > 3) {
        box.draw(box.marginX + WIDTH/2, box.offsetBottom + box.marginY);
        text.draw(sheets[3], box.marginX + WIDTH/2, box.offsetBottom + box.marginY);
    }
}

/**
 * Writes the continuities for the selected dot on the PDF. Includes:
 *      - Movements
 *      - Total beats
 *      - Border between general movements, e.g. Stand and Play vs. Continuity vs. FMHS
 */
var _individualContinuity = function() {

}

/**
 * Draws the diagram for a selected dot's movements. Includes:
 *      - Circle for start
 *      - Cross for end
 *      - Path line and number of steps per movement
 *      - Yard lines, yard line markers
 *      - Hashes if in viewport
 *      - Zooming if big
 *      - Orientation EWNS; East is up
 */
var _movementDiagram = function() {

}

/**
 * Draws the overall bird's eye view of the field. Includes:
 *      - Field outline, no yardlines/hashes
 *      - Form outline, continuous for 4-step EW, 2-step NS
 *      - Circle selected dot
 *      - Cross hairs for positions (4S N40, 2E WH)
 */
var _birdseye = function() {

}

/**
 * Draws the dots surrounding the selected dot. Includes:
 *      - Orientation always E up (for now)
 *      - 4 step radius
 *      - Solid line cross hairs; selected dot in middle
 *      - Dot labels
 *      - Dot types
 */
var _surroundingDots = function() {

}

module.exports = generate;
