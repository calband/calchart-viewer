/**
 * @fileOverview This file will export a class that can generate a PDF representation
 * of dots and movements
 *
 * @constant WIDTH is the width of the PDF document, in millimeters
 * @constant HEIGHT is the height of the PDF document, in millimeters
 * @constant QUADRANT contains (x,y) coordinates for the top left corner of each quadrant
 *      of the document. y coordinates offset by headers
 * @constant DOT_DATA contains the JPEG image data for the different dot types
 */

/* CONSTANTS: DON'T CHANGE */
var WIDTH = 215.9;
var HEIGHT = 279.4;

var QUADRANT = [
    {x: 0, y: 22},                 // top left
    {x: 0, y: HEIGHT/2 + 16},      // bottom left
    {x: WIDTH/2, y: 22},           // top right
    {x: WIDTH/2, y: HEIGHT/2 + 16} // bottom right
];
var QUADRANT_HEIGHT = HEIGHT/2 - 22;

var DOT_DATA = {
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
 * This PDFGenerator class will be able to generate the PDF representation of the given
 * show, for the given dot.
 *
 * @param {Show} show
 * @param {String} dot is the label of the selected dot
 */
var PDFGenerator = function(show, dot) {
    this.pdf = jsPDF("portrait", "mm", "letter");
    this.show = show;
    this.dot = dot;
    this.sheets = show.getSheets();
};

/**
 * generate will generate a PDF for a specific dot, containing its movements,
 * positions, and continuities relevant to it.
 *
 * The function will end with a save call, which will prompt a new window and/or
 * a dialog box to download the generated PDF.
 */
PDFGenerator.prototype.generate = function() {
    for (var pageNum = 0; pageNum < Math.ceil(this.sheets.length / 4); pageNum++) {
        if (pageNum != 0) {
            this.pdf.addPage();
        }

        var pageSheets = []
        for (var i = 0; i < 4; i++) {
            var sheet = pageNum * 4 + i;
            if (sheet == this.sheets.length) {
                break;
            }
            pageSheets.push(this.sheets[sheet]);
        }

        this._addHeaders(pageNum + 1);

        for (var i = 0; i < pageSheets.length; i++) {
            var x = QUADRANT[i].x;
            var y = QUADRANT[i].y;
            var sheet = pageSheets[i];
            this._addDotContinuity(x, y, sheet);
            this._addIndividualContinuity(x, y);
            this._addMovementDiagram(x, y);
            this._addBirdseye(x, y);
            this._addSurroundingDots(x, y);
        }
    }
    this.pdf.save("show.pdf");
};

/**
 * Returns the width of a String, in whatever units this.pdf is currently using
 * @param {String} text
 * @param {int} size, font size the text will be in
 */
PDFGenerator.prototype._getTextWidth = function(text, size) {
    return this.pdf.getStringUnitWidth(text) * size/this.pdf.internal.scaleFactor
};

/**
 * Returns the height of text in the current fontsize, in whatever units this.pdf is
 * currently using
 * @param {int} size, font size the text will be in
 */
PDFGenerator.prototype._getTextHeight = function(size) {
    return size/this.pdf.internal.scaleFactor;
};

/**
 * Draws the headers on the PDF. Includes:
 *      - Stuntsheet number
 *      - Dot number
 *      - "California Marching Band: <show title>"
 *      - Page number
 *
 * @param {int} pageNum is the current 1-indexed page number
 */
PDFGenerator.prototype._addHeaders = function(pageNum) {
    var totalPages = Math.ceil(this.sheets.length/4);
    var _this = this; // for use in nested functions

    var header = {
        title: {
            label: "California Marching Band:",
            text: _this.show.getTitle(),
            size: 16,

            getX: function(text) {
                return WIDTH/2 - _this._getTextWidth(text, this.size)/2;
            },

            getY: function() {
                return header.y + header.paddingY + _this._getTextHeight(this.size);
            },

            getLineHeight: function() {
                return _this._getTextHeight(this.size) + 1;
            }
        },

        pageInfo: {
            size: 12,

            getWidth: function() {
                return _this._getTextWidth(pageNum + "/" + totalPages, this.size);
            },

            getHeight: function() {
                return _this._getTextHeight(this.size);
            },

            draw: function() {
                var numWidth = _this._getTextWidth(String(pageNum), this.size);
                _this.pdf.text(
                    String(pageNum),
                    this.x,
                    this.y - 1
                );
                _this.pdf.text(
                    "/",
                    this.x + numWidth - .3,
                    this.y
                );
                _this.pdf.text(
                    String(totalPages),
                    this.x + numWidth + .7,
                    this.y + 1
                );
            }
        },

        x: WIDTH * 1/6,
        y: 5,
        width: WIDTH * 2/3,
        height: _this._getTextHeight(16) * 3,
        paddingX: 3,
        paddingY: 1,

        draw: function() {
            /* box */
            _this.pdf.rect(this.x, this.y, this.width, this.height);

            /* title */
            _this.pdf.setFontSize(this.title.size);
            _this.pdf.text(
                this.title.label,
                this.title.getX(this.title.label),
                this.title.getY()
            );
            _this.pdf.text(
                this.title.text,
                this.title.getX(this.title.text),
                this.title.getY() + this.title.getLineHeight()
            );

            /* page info */
            _this.pdf.setFontSize(this.pageInfo.size);
            this.pageInfo.x = this.x + this.paddingX;
            this.pageInfo.y = this.y + this.height/2 + this.pageInfo.getHeight()/2;
            this.pageInfo.draw();

            this.pageInfo.x = WIDTH * 5/6 - this.paddingX - this.pageInfo.getWidth();
            this.pageInfo.draw();
        }
    };

    var sheetInfo = {
        marginX: 4,
        marginY: 3,
        size: 14,
        sheet: (pageNum - 1) * 4 + 1,

        getTop: function() {
            return this.marginY + this.height;
        },

        getBottom: function() {
            return this.getTop() + HEIGHT/2;
        },

        getLeft: function() {
            return this.marginX;
        },

        getRight: function() {
            return WIDTH - this.width;
        },

        hasNext: function() {
            return ++this.sheet <= _this.sheets.length;
        },

        draw: function(x, y) {
            _this.pdf.text("SS " + this.sheet + "/" + _this.sheets.length, x, y);
            _this.pdf.text("Dot " + _this.dot, x, y + _this._getTextHeight(this.size));
        }
    };

    /* Title and Page information */
    header.draw();

    /* Stuntsheet and Dot Info */
    sheetInfo.height = _this._getTextHeight(sheetInfo.size);
    sheetInfo.width = _this._getTextWidth("SS 00/00", sheetInfo.size);

    sheetInfo.draw(sheetInfo.getLeft(), sheetInfo.getTop());

    if (sheetInfo.hasNext()) {
        sheetInfo.draw(sheetInfo.getLeft(), sheetInfo.getBottom());
    }

    if (sheetInfo.hasNext()) {
        sheetInfo.draw(sheetInfo.getRight(), sheetInfo.getTop());
    }

    if (sheetInfo.hasNext()) {
        sheetInfo.draw(sheetInfo.getRight(), sheetInfo.getBottom());
    }
};

/**
 * Writes one stuntsheet's continuity for the given dot type on the PDF. Includes:
 *      - Dot circle type
 *      - Overall Continuity
 *      - Measure/beat number
 *
 * @param {int} quadrantX  The x-coordinate of the top left corner of the quadrant
 * @param {int} quadrantY  The y-coordinate of the top left corner of the quadrant
 * @param {Sheet} sheet the current sheet
 */
PDFGenerator.prototype._addDotContinuity = function(quadrantX, quadrantY, sheet) {
    var _this = this; // for use in nested functions

    var box = {
        paddingX: 2,
        paddingY: 1,
        marginX: 3,
        marginY: 2,

        getWidth: function() {
            return WIDTH/2 - this.marginX * 2;
        },

        draw: function(height) {
            var x = quadrantX + this.marginX;
            var y = quadrantY + this.marginY;
            _this.pdf.rect(x, y, this.getWidth(), height);
        }
    };

    var text = {
        x: quadrantX + box.marginX + box.paddingX,
        y: quadrantY + box.marginY + box.paddingY,
        size: 10,

        // width is the width of the containing box
        draw: function() {
            var dotType = sheet.getDotType(_this.dot);
            var dotImage = DOT_DATA[dotType];
            var maxWidth = box.getWidth() - box.paddingX*2 - 6;
            var _size = this.size;

            var continuities = sheet.getContinuityTexts(dotType).map(function(text) {
                var origSize = _size;
                while (_this._getTextWidth(text, _size) > maxWidth) {
                    _size--;
                }

                return text;
            });

            if (continuities.length > 4) {
                _size -= 2;
            }

            _this.pdf.addImage(
                dotImage,
                "JPEG",
                this.x,
                this.y
            );
            _this.pdf.setFontSize(this.size);
            _this.pdf.text(
                ":",
                this.x + 4,
                this.y + 3
            );
            _this.pdf.setFontSize(_size);
            _this.pdf.text(
                continuities,
                this.x + 6,
                this.y + 3.5
            );

            var height = _this._getTextHeight(_size) * continuities.length + 2*box.paddingY + 1;
            box.draw(height);
        }
    };

    text.draw();
};

/**
 * Writes the continuities for the selected dot on the PDF. Includes:
 *      - Movements
 *      - Total beats
 *      - Border between general movements, e.g. Stand and Play vs. Continuity vs. FMHS
 *
 * @param {int} quadrantX  The x-coordinate of the top left corner of the quadrant
 * @param {int} quadrantY  The y-coordinate of the top left corner of the quadrant
 */
PDFGenerator.prototype._addIndividualContinuity = function(quadrantX, quadrantY) {

};

/**
 * Draws the diagram for a selected dot's movements. Includes:
 *      - Circle for start
 *      - Cross for end
 *      - Path line and number of steps per movement
 *      - Yard lines, yard line markers
 *      - Hashes if in viewport
 *      - Zooming if big
 *      - Orientation EWNS; East is up
 *
 * @param {int} quadrantX  The x-coordinate of the top left corner of the quadrant
 * @param {int} quadrantY  The y-coordinate of the top left corner of the quadrant
 */
PDFGenerator.prototype._addMovementDiagram = function(quadrantX, quadrantY) {

};

/**
 * Draws the overall bird's eye view of the field. Includes:
 *      - Field outline, no yardlines/hashes
 *      - Form outline, continuous for 4-step EW, 2-step NS
 *      - Circle selected dot
 *      - Cross hairs for positions (4S N40, 2E WH)
 *
 * @param {int} quadrantX  The x-coordinate of the top left corner of the quadrant
 * @param {int} quadrantY  The y-coordinate of the top left corner of the quadrant
 */
PDFGenerator.prototype._addBirdseye = function(quadrantX, quadrantY) {

};

/**
 * Draws the dots surrounding the selected dot. Includes:
 *      - Orientation always E up (for now)
 *      - 4 step radius
 *      - Solid line cross hairs; selected dot in middle
 *      - Dot labels
 *      - Dot types
 *
 * @param {int} quadrantX  The x-coordinate of the top left corner of the quadrant
 * @param {int} quadrantY  The y-coordinate of the top left corner of the quadrant
 */
PDFGenerator.prototype._addSurroundingDots = function(quadrantX, quadrantY) {

};

module.exports = PDFGenerator;
