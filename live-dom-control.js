/*
	Copyright (C) 2013 Guilherme Vieira 

	This program is free software: you can redistribute it and/or modify
	it under the terms of the GNU General Public License as published by
	the Free Software Foundation, either version 3 of the License, or
	(at your option) any later version.

	This program is distributed in the hope that it will be useful,
	but WITHOUT ANY WARRANTY; without even the implied warranty of
	MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the
	GNU General Public License for more details.

	You should have received a copy of the GNU General Public License
	along with this program.  If not, see <http://www.gnu.org/licenses/>.
*/
var last_handler_id = 0;
function get_metadata(element)
{
	var $element = $(element);
	var metadata = $element.data('live-dom-control');
	if(!metadata)
	{
		metadata =
		{
			handlers: []
		};
		$element.data('live-dom-control', metadata);
	}
	return metadata;
}
function remove_metadata(element)
{
	var $element = $(element);
	var metadata = $element.data('live-dom-control');
	if(metadata)
	{
		$element.removeData('live-dom-control');
	}
	return metadata;
}
window.dom_control = function(selector, handler)
{
	var handler_id = ++last_handler_id;
	var handler_entry = dom_control.handlers[handler_id] =
	{
		id: handler_id,
		selector: selector,
		handler: handler
	};
	$(selector).each
	(
		function(i, element)
		{
			get_metadata(element).handlers.push(handler_entry);
			handler('exists', element);
		}
	);
	return handler_id;
};
dom_control.remove = function(handler_id)
{
	var handler_entry = dom_control.handlers[handler_id];
	handler_entry.elements.forEach
	(
		function(element)
		{
			remove_metadata(element);
			handler_entry.handler('handler-removed');
		}
	);
	delete dom_control.handlers[handler_id];
};
var handlers = dom_control.handlers = {};
var MutationObserver = MutationObserver || WebKitMutationObserver;
var big_brother = dom_control.big_brother = new MutationObserver
(
	function(mutations)
	{
		mutations.forEach
		(
			function(mutation)
			{
				if(mutation.attributeName)
				{
					var $target = $(mutation.target);
					for(var handler_id in handlers)
					{
						var handler_entry = handlers[handler_id];
						if($target.is(handler_entry.selector))
						{
							handler_entry.handler
							(
								'mutated',
								mutation.target,
								mutation.attributeName,
								mutation.oldValue
							);
						}
					}
				}
				else
				if(mutation.addedNodes.length > 0)
				{
					var $added_nodes = $(mutation.addedNodes);
					for(var handler_id in handlers)
					{
						var handler_entry = handlers[handler_id];
						var selector = handler_entry.selector;
						$added_nodes.find(selector).addBack(selector).each
						(
							function(i, added_node)
							{
								get_metadata(added_node).handlers.push(handler_entry);
								handler_entry.handler('added', added_node);
							}
						);
					}
				}
				else
				if(mutation.removedNodes.length > 0)
				{
					$(mutation.removedNodes).find('*').addBack('*').each
					(
						function(i, removed_node)
						{
							var metadata = remove_metadata(removed_node);
							if(metadata)
							{
								metadata.handlers.forEach
								(
									function(handler_entry)
									{
										handler_entry.handler('removed', removed_node);
									}
								);
							}
						}
					);
				}
			}
		);
	}
);
big_brother.observe(document, { attributes: true, attributeOldValue: true, subtree: true, childList: true });
