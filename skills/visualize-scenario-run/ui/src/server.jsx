import * as React from 'react';
import { renderToStaticMarkup } from 'react-dom/server';
import { Button } from './components/button.jsx';
import { Card } from './components/card.jsx';
import { Textarea } from './components/textarea.jsx';
export const buttonHtml = (props, text) => renderToStaticMarkup(<Button type="button" variant="outline" {...props}>{text}</Button>);
export const textareaHtml = props => renderToStaticMarkup(<Textarea {...props} />);
export const queueHtml = (title, description) => renderToStaticMarkup(<Card className="queue-current" aria-current="true"><h3>{title}</h3><p>{description}</p></Card>);
